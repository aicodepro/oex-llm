import { GoogleCustomSearch } from '@langchain/community/tools/google_custom_search'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'

class GoogleSearchConsoleAPI_Aicodepro implements INode {
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
        this.name = 'GoogleSearchConsoleAPI'
        this.version = 1.0
        this.type = 'GoogleSearchConsoleAPI'
        this.icon = 'google-search-console.svg'
        this.category = 'Aicodepro'
        this.description = 'Wrapper around Google Search Console API - a real-time API to access Google search console results'
        this.inputs = []
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['googleCustomSearchApi']
        }
        this.baseClasses = [this.type, ...getBaseClasses(GoogleCustomSearch)]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const googleApiKey = getCredentialParam('googleCustomSearchApiKey', credentialData, nodeData)
        const googleCseId = getCredentialParam('googleCustomSearchApiId', credentialData, nodeData)
        return new GoogleCustomSearch({ apiKey: googleApiKey, googleCSEId: googleCseId })
    }
}

module.exports = { nodeClass: GoogleSearchConsoleAPI_Aicodepro }
