import { Tool } from '@langchain/core/tools'
import { getEnvironmentVariable } from '@langchain/core/utils/env'
import axios from 'axios'
import { JWTInput } from 'google-auth-library'
import { google } from 'googleapis'

export interface RankNowParams {
    serviceAccountCred?: JWTInput
    indexNowKey?: string
}

export class RankNow extends Tool {
    static lc_name() {
        return 'RankNow'
    }

    get lc_secrets(): { [key: string]: string } | undefined {
        return {
            serviceAccountCred: 'SERVICE_ACCOUNT_KEY',
            indexNowKey: 'INDEX_NOW_KEY'
        }
    }

    name = 'rank-now'

    protected serviceAccountCred: JWTInput
    protected indexNowKey: string

    description =
        'Use Rank now API to index your website urls on google and other engines. Input should be the service account credential and valid urls in array. Output will the json object giving the response by the request.'

    constructor(
        fields: RankNowParams = {
            serviceAccountCred: JSON.parse(getEnvironmentVariable('SERVICE_ACCOUNT_KEY') || '{}'),
            indexNowKey: getEnvironmentVariable('INDEX_NOW_KEY')
        }
    ) {
        super(...arguments)
        if (!fields.serviceAccountCred && !fields.indexNowKey) {
            throw new Error(`Service Account API key not set. You can set it as "SERVICE_ACCOUNT_KEY" in your environment variables.`)
        }
        this.serviceAccountCred = fields.serviceAccountCred as JWTInput
        this.indexNowKey = fields.indexNowKey as string
    }

    async _call(input: string) {
        if (!this.serviceAccountCred && !this.indexNowKey) {
            throw new Error('Google API credentials or Index Now Key are required.')
        }
        let urls: string[]
        try {
            urls = JSON.parse(input)
            if (!Array.isArray(urls)) {
                throw new Error('Input must be a valid array of URLs.')
            }
        } catch (err) {
            throw new Error('Invalid input format. Expected a JSON array of URLs.')
        }
        if (!urls || urls.length === 0) {
            throw new Error('At least one URL is required.')
        }
        // Initialize Google API client
        const results = []

        if (this.serviceAccountCred) {
            const auth = new google.auth.GoogleAuth({
                credentials: this.serviceAccountCred,
                scopes: ['https://www.googleapis.com/auth/indexing']
            })

            const indexing = google.indexing({
                version: 'v3',
                auth // Use GoogleAuth instance directly
            })

            // Submit URLs for indexing
            for (const url of urls) {
                try {
                    console.log(url)
                    const response = await indexing.urlNotifications.publish({
                        requestBody: {
                            type: 'URL_UPDATED',
                            url: url
                        }
                    })
                    results.push({ url, status: 'success', response })
                } catch (error) {
                    results.push({ url, status: 'error', error })
                }
            }
        }
        if (this.indexNowKey) {
            const hostname = new URL(urls[0]).hostname
            const endpoint = `https://api.indexnow.org/indexnow` // Generic endpoint; check specific ones for each search engine
            const payload = {
                host: hostname,
                key: this.indexNowKey,
                urlList: [...urls]
            }
            try {
                await axios.post(endpoint, payload)
                results.push({ type: 'success', message: 'URL submitted on IndexNow' })
            } catch (error) {
                results.push({ status: 'error', error })
            }
        }
        return JSON.stringify({
            results
        })
    }
}
