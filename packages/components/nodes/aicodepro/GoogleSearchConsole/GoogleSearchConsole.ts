import { GoogleSearchConsole } from './GoogleSearchConsoleAPI'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { Auth } from 'googleapis' // Import googleapis for Google Search Console API
import fs from 'fs' // For reading file-based credentials

class GoogleSearchConsole_Aicodepro implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Google Search Console'
        this.name = 'GoogleSearchConsole'
        this.version = 1.0
        this.type = 'GoogleSearchConsoleAPI'
        this.icon = 'google-search-console.svg'
        this.category = 'Aicodepro'
        this.description = 'Wrapper around Google Search Console API - Retrieve search analytics for a given website'
        this.inputs = [
            {
                label: 'Site URL',
                name: 'siteUrl',
                type: 'string',
                description: 'The site URL for the Search Console data. Example: example.com or sc-domain:example.com.'
            },
            {
                label: 'Row Limit',
                name: 'rowLimit',
                type: 'number',
                default: 10000,
                description: 'Number of rows to return. Default is 10000.'
            },
            {
                label: 'Start Date',
                name: 'startDate',
                type: 'string',
                default: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
                description: 'The start date for the data range (ISO format). Default is one month ago.'
            },
            {
                label: 'End Date',
                name: 'endDate',
                type: 'string',
                default: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
                description: 'The end date for the data range (ISO format). Default is yesterday.'
            },
            {
                label: 'Queries (Comma Separated)',
                name: 'queries',
                type: 'string',
                default: '',
                description: 'Comma-separated list of queries to filter results by. Leave empty for all queries.'
            }
        ]
        this.credential = {
            label: 'Google Search Console Credentials',
            name: 'credential',
            type: 'credential',
            credentialNames: ['googleSearchConsoleAuth'],
            optional: true,
            description:
                'Google Search Console Credentials. If you are using a GCP service like Cloud Run, or if you have installed default credentials on your local machine, you do not need to set this credential.'
        }
        this.baseClasses = [this.type, ...getBaseClasses(GoogleSearchConsole)]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        // Parse credential file path or JSON
        let serviceAccountCredentials: Auth.JWTInput | null = null

        const credentialFilePath = getCredentialParam('googleSearchConsoleCredentialFilePath', credentialData, nodeData)
        const credentialJson = getCredentialParam('googleSearchConsoleCredential', credentialData, nodeData)

        if (credentialFilePath) {
            try {
                const fileContent = fs.readFileSync(credentialFilePath, 'utf-8')
                serviceAccountCredentials = JSON.parse(fileContent) as Auth.JWTInput
            } catch (error) {
                throw new Error(`Failed to read Google Search Console credential file: ${error.message}`)
            }
        } else if (credentialJson) {
            try {
                serviceAccountCredentials = JSON.parse(credentialJson) as Auth.JWTInput
            } catch (error) {
                throw new Error(`Failed to parse Google Search Console credential JSON: ${error.message}`)
            }
        } else {
            throw new Error('Google Search Console credentials (file path or JSON) are required.')
        }
        console.log('serviceAccountCredentials =', serviceAccountCredentials)
        const { siteUrl, rowLimit, startDate, endDate, queries } = nodeData.inputs ?? {}

        // Validation: Ensure required fields are provided
        if (!siteUrl) {
            throw new Error('Site URL is required for the Google Search Console API.')
        }

        return new GoogleSearchConsole({
            serviceAccountCredentials: serviceAccountCredentials,
            siteUrl: siteUrl,
            rowLimit: rowLimit ?? 100,
            startDate: startDate ?? new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
            endDate: endDate ?? new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
            queries: queries ?? ''
        })
    }
}

module.exports = { nodeClass: GoogleSearchConsole_Aicodepro }
