import { PageSpeedInsights } from './PageSpeedInsightsAPI'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'

class PageSpeedInsights_Aicodepro implements INode {
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
        this.label = 'Page Speed Insights'
        this.name = 'PageSpeedInsights'
        this.version = 1.0
        this.type = 'GoogleCustomSearchAPI'
        this.icon = 'google-lighthouse.svg'
        this.category = 'Aicodepro'
        this.description = 'Wrapper around Page Speed Insights API - a real-time API to access Page Speed Insights results'
        this.inputs = []
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['googleCustomSearchApi']
        }
        this.baseClasses = [this.type, ...getBaseClasses(PageSpeedInsights)]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const googleApiKey = getCredentialParam('googleCustomSearchApiKey', credentialData, nodeData)
        return new PageSpeedInsights({ apiKey: googleApiKey })
    }
}

module.exports = { nodeClass: PageSpeedInsights_Aicodepro }
