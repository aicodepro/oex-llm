import { Tool } from '@langchain/core/tools'
import { getEnvironmentVariable } from '@langchain/core/utils/env'
import { google, webmasters_v3 } from 'googleapis'
import { JWTInput } from 'google-auth-library'

/**
 * Interface for parameters required by Google Search Console class.
 */
export interface GoogleSearchConsoleParams {
    serviceAccountCredentials?: JWTInput // Use proper typing for JWT credentials
    rowLimit?: number // Number of rows to fetch, defaults to 10,000
    startDate?: string // Start date in YYYY-MM-DD format, defaults to one month ago
    endDate?: string // End date in YYYY-MM-DD format, defaults to yesterday
    queries?: string | string[] // Accepts a comma-separated string or an array of query strings
    siteUrl: string // URL of the site to analyze (e.g., sc-domain:example.com)
}

/**
 * Class that uses the Google Search Console API to fetch data.
 * Requires the service account credentials stored in Flowise secrets.
 */
export class GoogleSearchConsole extends Tool {
    static lc_name() {
        return 'GoogleSearchConsole'
    }

    get lc_secrets(): { [key: string]: string } | undefined {
        return {
            serviceAccountCredentials: 'GOOGLE_SEARCH_CONSOLE_CREDENTIALS' // Flowise secret for service account credentials
        }
    }

    name = 'google-search-console'
    description =
        'Fetches search analytics from Google Search Console for a given site. Returns search queries, impressions, clicks, and more.'

    protected serviceAccountCredentials: JWTInput
    protected rowLimit: number
    protected startDate: string
    protected endDate: string
    protected queries: string[]
    protected siteUrl: string

    constructor(
        fields: GoogleSearchConsoleParams = {
            serviceAccountCredentials: JSON.parse(getEnvironmentVariable('GOOGLE_SEARCH_CONSOLE_CREDENTIALS') || '{}'),
            rowLimit: 10,
            startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], // 1 month ago
            endDate: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0], // Yesterday
            queries: '',
            siteUrl: ''
        }
    ) {
        super(...arguments)

        if (!fields.serviceAccountCredentials) {
            throw new Error(
                `Google Search Console service account credentials not set. You can set it as "GOOGLE_SEARCH_CONSOLE_CREDENTIALS" in your environment variables.`
            )
        }

        this.serviceAccountCredentials = fields.serviceAccountCredentials as JWTInput
        this.rowLimit = fields.rowLimit ?? 100
        this.startDate = fields.startDate ?? new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
        this.endDate = fields.endDate ?? new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]
        this.queries = Array.isArray(fields.queries) ? fields.queries : fields.queries?.split(',').map((query) => query.trim()) || []
        this.siteUrl = fields.siteUrl
    }

    async _call() {
        if (!this.siteUrl) {
            throw new Error('Site URL is required.')
        }
        // Initialize GoogleAuth with the credentials
        const auth = new google.auth.GoogleAuth({
            credentials: this.serviceAccountCredentials,
            scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
        })

        const searchConsole = google.webmasters({
            version: 'v3',
            auth // Use GoogleAuth instance directly
        })

        // Prepare the query parameters
        const requestParams: webmasters_v3.Params$Resource$Searchanalytics$Query = {
            siteUrl: this.siteUrl.startsWith('sc-domain:') ? this.siteUrl : `sc-domain:${this.siteUrl}`,
            requestBody: {
                startDate: this.startDate,
                endDate: this.endDate,
                rowLimit: this.rowLimit,
                dimensions: this.queries.length > 0 ? ['query'] : [],
                dimensionFilterGroups:
                    this.queries.length > 0
                        ? [
                              {
                                  filters: this.queries.map((query) => ({
                                      dimension: 'query',
                                      operator: 'equals',
                                      expression: query
                                  }))
                              }
                          ]
                        : []
            }
        }

        try {
            const res = await searchConsole.searchanalytics.query(requestParams)
            console.log(res)
            return res.data.rows || []
        } catch (error) {
            throw new Error(`Error fetching data from Google Search Console API: ${error.message}`)
        }
    }
}
