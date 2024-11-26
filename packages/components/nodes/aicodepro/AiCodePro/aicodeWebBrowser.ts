import type { BaseLanguageModelInterface } from '@langchain/core/language_models/base'
import { Document } from '@langchain/core/documents'
import type { EmbeddingsInterface } from '@langchain/core/embeddings'
import axiosMod, { AxiosRequestConfig, AxiosStatic } from 'axios'
import * as cheerio from 'cheerio'
import { CallbackManager, CallbackManagerForToolRun } from '@langchain/core/callbacks/manager'
import { isNode } from '@langchain/core/utils/env'
import { Tool, ToolParams } from '@langchain/core/tools'
import { RunnableSequence } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { TextSplitter, RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
// @ts-ignore
import fetchAdapter from './axios-fetch-adapter.js'
import { formatDocumentsAsString } from './document'

export const parseInputs = (inputs: string): [string, string] => {
    const [baseUrl, task] = inputs.split(',').map((input) => {
        let t = input.trim()
        t = t.startsWith('"') ? t.slice(1) : t
        t = t.endsWith('"') ? t.slice(0, -1) : t
        // it likes to put / at the end of urls, wont matter for task
        t = t.endsWith('/') ? t.slice(0, -1) : t
        return t.trim()
    })

    return [baseUrl, task]
}

export const getText = (html: string, baseUrl: string, summary: boolean): string => {
    // scriptingEnabled so noscript elements are parsed
    const $ = cheerio.load(html, { scriptingEnabled: true })

    let text = ''

    // lets only get the body if its a summary, dont need to summarize header or footer etc
    const rootElement = summary ? 'body ' : '*'

    $(`${rootElement}:not(style):not(script):not(svg)`).each((_i, elem: any) => {
        // we dont want duplicated content as we drill down so remove children
        let content = $(elem).clone().children().remove().end().text().trim()
        const $el = $(elem)

        // if its an ahref, print the content and url
        let href = $el.attr('href')
        if ($el.prop('tagName')?.toLowerCase() === 'a' && href) {
            if (!href.startsWith('http')) {
                try {
                    href = new URL(href, baseUrl).toString()
                } catch {
                    // if this fails thats fine, just no url for this
                    href = ''
                }
            }

            const imgAlt = $el.find('img[alt]').attr('alt')?.trim()
            if (imgAlt) {
                content += ` ${imgAlt}`
            }

            text += ` [${content}](${href})`
        }
        // otherwise just print the content
        else if (content !== '') {
            text += ` ${content}`
        }
    })

    return text.trim().replace(/\n+/g, ' ')
}

const getHtml = async (baseUrl: string, h: Headers, config: AxiosRequestConfig) => {
    const axios = ('default' in axiosMod ? axiosMod.default : axiosMod) as AxiosStatic

    const domain = new URL(baseUrl).hostname

    const headers = { ...h }
    // these appear to be positional, which means they have to exist in the headers passed in
    headers.Host = domain
    headers['Alt-Used'] = domain

    let htmlResponse
    try {
        htmlResponse = await axios.get(baseUrl, {
            ...config,
            headers
        })
    } catch (e) {
        if (axios.isAxiosError(e) && e.response && e.response.status) {
            throw new Error(`http response ${e.response.status}`)
        }
        throw e
    }

    const allowedContentTypes = ['text/html', 'application/json', 'application/xml', 'application/javascript', 'text/plain']

    const contentType = htmlResponse.headers['content-type']
    const contentTypeArray = contentType.split(';')
    if (contentTypeArray[0] && !allowedContentTypes.includes(contentTypeArray[0])) {
        throw new Error('returned page was not utf8')
    }
    return htmlResponse.data
}

const DEFAULT_HEADERS = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'en-US,en;q=0.5',
    'Alt-Used': 'LEAVE-THIS-KEY-SET-BY-TOOL',
    Connection: 'keep-alive',
    Host: 'LEAVE-THIS-KEY-SET-BY-TOOL',
    Referer: 'https://www.google.com/',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/111.0'
}

type Headers = Record<string, any>

/**
 * Defines the arguments that can be passed to the WebBrowser constructor.
 * It extends the ToolParams interface and includes properties for a
 * language model, embeddings, HTTP headers, an Axios configuration, a
 * callback manager, and a text splitter.
 */
export interface WebBrowserArgs extends ToolParams {
    model: BaseLanguageModelInterface

    embeddings: EmbeddingsInterface

    headers?: Headers

    axiosConfig?: Omit<AxiosRequestConfig, 'url'>

    /** @deprecated */
    callbackManager?: CallbackManager

    textSplitter?: TextSplitter
}

/**
 * A class designed to interact with web pages, either to extract
 * information from them or to summarize their content. It uses the axios
 * library to send HTTP requests and the cheerio library to parse the
 * returned HTML.
 * @example
 * ```typescript
 * const browser = new WebBrowser({
 *   model: new ChatOpenAI({ temperature: 0 }),
 *   embeddings: new OpenAIEmbeddings({}),
 * });
 * const result = await browser.invoke("https:exampleurl.com");
 * ```
 */
export class AicodeproWebBrowser extends Tool {
    static lc_name() {
        return 'WebBrowser'
    }

    get lc_namespace() {
        return [...super.lc_namespace, 'webbrowser']
    }

    private model: BaseLanguageModelInterface

    private embeddings: EmbeddingsInterface

    private headers: Headers

    private axiosConfig: Omit<AxiosRequestConfig, 'url'>

    private textSplitter: TextSplitter

    constructor({ model, headers, embeddings, axiosConfig, textSplitter }: WebBrowserArgs) {
        super(...arguments)

        this.model = model
        this.embeddings = embeddings
        this.headers = headers ?? DEFAULT_HEADERS
        this.axiosConfig = {
            withCredentials: true,
            adapter: isNode() ? undefined : fetchAdapter,
            ...axiosConfig
        }
        this.textSplitter =
            textSplitter ??
            new RecursiveCharacterTextSplitter({
                chunkSize: 2000,
                chunkOverlap: 200
            })
    }

    private extractPageData(html: string, baseUrl: string) {
        const $ = cheerio.load(html)

        // Extract SEO Metadata
        const title = $('title').text().trim()
        const metaDescription = $('meta[name="description"]').attr('content') || ''
        const metaKeywords = $('meta[name="keywords"]').attr('content') || ''

        // Extract Contact Details
        const contactDetails: string[] = []
        $('a[href^="mailto:"], a[href^="tel:"]').each((_i, el) => {
            const link = $(el).attr('href')
            if (link) contactDetails.push(link)
        })

        // Extract Social Media Links
        const socialLinks: string[] = []
        $(
            'a[href*="facebook.com"], a[href*="twitter.com"], a[href*="linkedin.com"], a[href*="instagram.com"], a[href*="youtube.com"]'
        ).each((_index, element) => {
            let href = $(element).attr('href')
            if (href && !href.startsWith('http')) {
                try {
                    href = new URL(href, baseUrl).toString()
                } catch {
                    href = ''
                }
            }
            if (href) socialLinks.push(href)
        })

        return {
            title,
            metaDescription,
            metaKeywords,
            contactDetails,
            socialLinks
        }
    }

    private extractReadableText(html: string): string {
        const $ = cheerio.load(html)
        let text = ''
        $('body')
            .find('*')
            .not('script, style, svg')
            .each((_i, elem) => {
                const content = $(elem).clone().children().remove().end().text().trim()
                if (content) text += ` ${content}`
            })
        return text.trim()
    }
    /** @ignore */
    async _call(inputs: string, runManager?: CallbackManagerForToolRun) {
        const [baseUrl, task] = parseInputs(inputs)
        const doSummary = !task

        let text
        let context
        try {
            const html = await getHtml(baseUrl, this.headers, this.axiosConfig)
            const pageData = this.extractPageData(html, baseUrl)
            const content = this.extractReadableText(html)
            text = `Summary:
                    Title: ${pageData.title}
                    Meta Description: ${pageData.metaDescription}
                    Meta Keywords: ${pageData.metaKeywords}
                    Contact Details: ${pageData.contactDetails.join(', ')}
                    Social Links: ${pageData.socialLinks.join(', ')}
                    Content Preview: ${content.substring(0, 500)}...`
        } catch (e) {
            if (e) {
                return e.toString()
            }
            return 'There was a problem connecting to the site'
        }

        const texts = await this.textSplitter.splitText(text)
        if (doSummary) {
            context = texts.slice(0, 4).join('\n')
        }
        const docs = texts.map(
            (pageContent) =>
                new Document({
                    pageContent,
                    metadata: []
                })
        )

        const vectorStore = await MemoryVectorStore.fromDocuments(docs, this.embeddings)
        const results = await vectorStore.similaritySearch(task, 4, undefined, runManager?.getChild('vectorstore'))
        context = formatDocumentsAsString(results)

        const input = `Text:${context}\n\nI need ${
            doSummary ? 'a summary' : task
        } from the above text, also provide up to 5 markdown links from within that would be of interest (always including URL and text). Links should be provided, if present, in markdown syntax as a list under the heading "Relevant Links:".`

        const chain = RunnableSequence.from([this.model, new StringOutputParser()])
        return chain.invoke(input, runManager?.getChild())
    }

    name = 'web-browser'

    description = `useful for when you need to find something on or summarize a webpage. input should be a comma separated list of "ONE valid http URL including protocol","what you want to find on the page or empty string for a summary".`
}
