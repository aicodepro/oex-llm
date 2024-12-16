import { parse } from 'node-html-parser'
import axios from 'axios'
import { URL } from 'url' // We use the URL module to easily manipulate and compare URLs

export const crawlWebsite = async (
    websiteUrl: string,
    headers: Record<string, string> = {},
    _budget: Record<string, number> = { '*': 50 },
    blacklist: string[] = [],
    pageLimit: number = 100
) => {
    const crawledPages = new Set() // To track crawled pages and avoid duplicates
    const pagesToVisit = [websiteUrl] // Starting with the homepage
    const allPages = []

    // Get the base domain of the website URL for internal link checking
    const baseDomain = new URL(websiteUrl).hostname

    // Helper function to get links from a page
    const getLinksFromPage = (htmlContent: string, url: string) => {
        const root = parse(htmlContent)
        const links = root
            .querySelectorAll('a')
            .map((a) => a.getAttribute('href'))
            .filter((href) => href && href.startsWith('/') && !href.includes('mailto:')) // Filter out mailto links and non-relative URLs
            .map((link) => {
                if (link) {
                    // Additional check to satisfy TypeScript's strict null checks
                    return new URL(link, url).href
                }
                return '' // Or handle this case accordingly, perhaps continue in a loop or log an error
            })
            .filter((link) => link !== '') // Remove any empty strings that may have been added
        return links
    }

    // Helper function to check if the URL is an internal link
    const isInternalLink = (link: string) => {
        const linkDomain = new URL(link).hostname
        return linkDomain === baseDomain // Only allow links with the same domain as the homepage
    }

    // Crawl the pages recursively
    while (pagesToVisit.length > 0 && allPages.length < pageLimit) {
        const currentUrl = pagesToVisit.shift() // Get the next URL to visit
        if (crawledPages.has(currentUrl)) continue // Skip if already crawled
        if (!currentUrl) continue
        try {
            const response = await axios.get(currentUrl, { headers })
            const htmlContent = response.data

            // Record the crawled page
            crawledPages.add(currentUrl)
            allPages.push({
                url: currentUrl,
                content: htmlContent,
                statusCode: response.status
            })

            // Get the links on the current page and add them to pagesToVisit if they're internal
            const links = getLinksFromPage(htmlContent, currentUrl)
            links.forEach((link) => {
                // Only add the link if it's internal and not blacklisted
                if (!crawledPages.has(link) && isInternalLink(link) && !blacklist.some((pattern) => new RegExp(pattern).test(link))) {
                    pagesToVisit.push(link)
                }
            })
        } catch (error) {
            console.error(`Error crawling ${currentUrl}:`, error.message)
        }
    }

    return allPages
}
