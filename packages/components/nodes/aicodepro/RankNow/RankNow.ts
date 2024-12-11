import { Auth } from 'googleapis'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { RankNow } from './RankNowApi'
import fs from 'fs' // For reading file-based credentials

class RankNow_Aicodepro implements INode {
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
        this.label = 'Rank Now'
        this.name = 'RankNow'
        this.version = 1.0
        this.icon = 'aicodepro.svg'
        this.category = 'Aicodepro'
        this.type = 'action'
        this.description = 'Submits URLs to Google or other search engines for indexing'
        this.inputs = []
        this.credential = {
            label: 'Rank Now Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['rankNowApi'],
            optional: true,
            description: 'Rank Now Credentials.'
        }
        this.baseClasses = [this.type, ...getBaseClasses(RankNow)]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        let serviceAccountCredentials: Auth.JWTInput | undefined = undefined

        const credentialFilePath = getCredentialParam('googleSearchConsoleCredentialFilePath', credentialData, nodeData)
        const credentialJson = getCredentialParam('googleSearchConsoleCredential', credentialData, nodeData)
        const indexNowKey = getCredentialParam('indexNowKey', credentialData, nodeData)

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
        } else if (!indexNowKey) {
            throw new Error('Google Search Console credentials (file path or JSON) or IndexNow Key is required.')
        }
        return new RankNow({ serviceAccountCred: serviceAccountCredentials, indexNowKey: indexNowKey })
    }
}

module.exports = { nodeClass: RankNow_Aicodepro }
