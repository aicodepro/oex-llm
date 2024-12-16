import { parse } from 'node-html-parser'

interface Page {
    url: string
    content: string
    statusCode: number
}

interface SEOErrorDetail {
    description: string
    count: number
    details: any
}

interface SEOWarningDetail {
    description: string
    count: number
    details: string[]
}

export interface SEOReport {
    totalPagesCrawled: number
    totalErrors: number
    totalWarnings: number
    errors: {
        [key: string]: SEOErrorDetail
    }
    warnings: {
        [key: string]: SEOWarningDetail
    }
}

export const analyzeSEO = (pages: Page[]) => {
    const seoReport: SEOReport = {
        totalPagesCrawled: pages.length,
        totalErrors: 0,
        totalWarnings: 0,
        errors: {
            ampIssues: { description: 'AMP-related issues', count: 0, details: [] },
            serverErrors: { description: 'Pages returned 5XX status codes', count: 0, details: [] },
            clientErrors: { description: 'Pages returned 4XX status codes', count: 0, details: [] },
            missingTitleTags: { description: 'Pages missing title tags', count: 0, details: [] },
            duplicateTitleTags: { description: 'Pages with duplicate title tags', count: 0, details: [] },
            duplicateContent: { description: 'Pages with duplicate content', count: 0, details: [] },
            brokenInternalLinks: { description: 'Broken internal links', count: 0, details: [] },
            uncrawlablePages: { description: "Pages that couldn't be crawled", count: 0, details: [] },
            dnsIssues: { description: 'DNS resolution issues', count: 0, details: [] },
            urlFormatIssues: { description: 'Incorrect URL formats', count: 0, details: [] },
            brokenInternalImages: { description: 'Broken internal images', count: 0, details: [] },
            duplicateMetaDescriptions: { description: 'Pages with duplicate meta descriptions', count: 0, details: [] }
        },
        warnings: {
            duplicateH1AndTitleTags: { description: 'Pages with duplicate H1 and title tags', count: 0, details: [] },
            tooMuchTextInTitleTags: { description: 'Pages with too much text within the title tags', count: 0, details: [] },
            missingH1Heading: { description: 'Pages missing an H1 heading', count: 0, details: [] },
            missingAltAttributes: { description: 'Images missing alt attributes', count: 0, details: [] },
            slowPageLoad: { description: 'Pages with slow load times', count: 0, details: [] }
        }
    }

    const titleMap = new Map() // Map to store title and corresponding URLs

    pages.forEach((page) => {
        const root = parse(page.content)
        const title = root.querySelector('title')?.innerText || ''
        const h1 = root.querySelector('h1')?.innerText || ''
        const metaDescription = root.querySelector('meta[name="description"]')?.getAttribute('content') || ''
        const links = root
            .querySelectorAll('a')
            .map((a) => a.getAttribute('href'))
            .filter(Boolean) as string[]
        const statusCode = page.statusCode

        // Group pages by title
        if (title) {
            if (!titleMap.has(title)) {
                titleMap.set(title, [])
            }
            titleMap.get(title).push(page.url)
        }

        // Error Calculations
        if (statusCode >= 500) {
            seoReport.errors.serverErrors.count += 1
            seoReport.errors.serverErrors.details.push(page.url)
        }
        if (statusCode >= 400 && statusCode < 500) {
            seoReport.errors.clientErrors.count += 1
            seoReport.errors.clientErrors.details.push(page.url)
        }
        if (!title) {
            seoReport.errors.missingTitleTags.count += 1
            seoReport.errors.missingTitleTags.details.push(page.url)
        }
        if (!metaDescription) {
            seoReport.errors.duplicateMetaDescriptions.count += 1
            seoReport.errors.duplicateMetaDescriptions.details.push(page.url)
        }
        if (title === h1 && title) {
            seoReport.warnings.duplicateH1AndTitleTags.count += 1
            seoReport.warnings.duplicateH1AndTitleTags.details.push(page.url)
        }
        if (!h1) {
            seoReport.warnings.missingH1Heading.count += 1
            seoReport.warnings.missingH1Heading.details.push(page.url)
        }
        if (!links.length) {
            seoReport.errors.brokenInternalLinks.count += 1
            seoReport.errors.brokenInternalLinks.details.push(page.url)
        }
    })

    // Process duplicate titles
    titleMap.forEach((urls) => {
        if (urls.length > 1) {
            seoReport.errors.duplicateTitleTags.count += urls.length
            seoReport.errors.duplicateTitleTags.details.push({
                duplicates: urls
            })
        }
    })

    // Calculate totals
    seoReport.totalErrors = Object.values(seoReport.errors).reduce((acc, error) => acc + error.count, 0)
    seoReport.totalWarnings = Object.values(seoReport.warnings).reduce((acc, warning) => acc + warning.count, 0)

    return seoReport
}
