import { getEnvironmentVariable } from '@langchain/core/utils/env'
import { Tool } from '@langchain/core/tools'

/**
 * Interface for parameters required by PageSpeedInsights class.
 */
export interface PageSpeedInsightsParams {
    apiKey?: string
}

/**
 * Class that uses the PageSpeed Insights API to retrieve Lighthouse scores.
 * Requires the environment variable `PAGE_SPEED_API_KEY` to be set.
 */
export class PageSpeedInsights extends Tool {
    static lc_name() {
        return 'PageSpeedInsights'
    }

    get lc_secrets(): { [key: string]: string } | undefined {
        return {
            apiKey: 'PAGE_SPEED_API_KEY'
        }
    }

    name = 'page-speed-insights'

    protected apiKey: string

    description =
        'Uses the PageSpeed Insights API to retrieve Lighthouse performance scores for a given URL. Input should be a valid URL. Outputs JSON with performance metrics.'

    constructor(
        fields: PageSpeedInsightsParams = {
            apiKey: getEnvironmentVariable('PAGE_SPEED_API_KEY')
        }
    ) {
        super(...arguments)
        if (!fields.apiKey) {
            throw new Error(`PageSpeed API key not set. You can set it as "PAGE_SPEED_API_KEY" in your environment variables.`)
        }
        this.apiKey = fields.apiKey
    }

    async _call(input: string) {
        const url = input
        const utm_campaign = 'Aicode Agent',
            utm_source = 'lighthouse'
        if (!url || !url.startsWith('http')) {
            throw new Error("Input must include a valid 'url' starting with http or https.")
        }

        // Define the categories to include in the API response
        const categories = ['performance', 'accessibility', 'best-practices', 'seo', 'pwa']

        // Helper function to fetch results for a given strategy
        const fetchResults = async (strategy: string) => {
            const queryParams = new URLSearchParams({
                url: url,
                key: this.apiKey,
                strategy, // Explicitly include strategy
                utm_campaign,
                utm_source
            })
            // Append each category to the query parameters
            categories.forEach((category) => queryParams.append('category', category))
            const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${queryParams.toString()}`)
            //console.log(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${queryParams.toString()}`)
            if (!res.ok) {
                throw new Error(`Got ${res.status} error from PageSpeed Insights API: ${res.statusText}`)
            }

            const json = await res.json()

            // Extract the main categories
            const performanceScore = json.lighthouseResult?.categories?.performance?.score ?? 'Unavailable'
            const accessibilityScore = json.lighthouseResult?.categories?.accessibility?.score ?? 'Unavailable'
            const bestPracticesScore = json.lighthouseResult?.categories?.['best-practices']?.score ?? 'Unavailable'
            const seoScore = json.lighthouseResult?.categories?.seo?.score ?? 'Unavailable'
            const pwaScore = json.lighthouseResult?.categories?.pwa?.score ?? 'Unavailable'

            // Extract key performance metrics
            const firstContentfulPaint = json.lighthouseResult?.audits['first-contentful-paint']?.displayValue ?? 'N/A'
            const largestContentfulPaint = json.lighthouseResult?.audits['largest-contentful-paint']?.displayValue ?? 'N/A'
            const speedIndex = json.lighthouseResult?.audits['speed-index']?.displayValue ?? 'N/A'
            const totalBlockingTime = json.lighthouseResult?.audits['total-blocking-time']?.displayValue ?? 'N/A'
            const cumulativeLayoutShift = json.lighthouseResult?.audits['cumulative-layout-shift']?.displayValue ?? 'N/A'

            // Return structured results
            return {
                strategy, // Include the strategy in the response
                scores: {
                    performance: performanceScore * 100, // Convert to percentage
                    accessibility: accessibilityScore * 100, // Convert to percentage
                    bestPractices: bestPracticesScore * 100, // Convert to percentage
                    seo: seoScore * 100, // Convert to percentage
                    pwa: pwaScore * 100 // Convert to percentage
                },
                metrics: {
                    firstContentfulPaint,
                    largestContentfulPaint,
                    speedIndex,
                    totalBlockingTime,
                    cumulativeLayoutShift
                }
            }
        }

        // Fetch results for both desktop and mobile strategies
        const desktopResults = await fetchResults('desktop')
        const mobileResults = await fetchResults('mobile')

        // Build the final structure
        return JSON.stringify({
            url,
            utm_campaign,
            utm_source,
            desktop: desktopResults,
            mobile: mobileResults
        })
    }
}
