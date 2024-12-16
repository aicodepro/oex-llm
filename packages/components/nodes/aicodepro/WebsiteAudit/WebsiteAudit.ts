import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { WebisteAudit } from './WebsiteAuditApi'

class WebsiteAudit_AiCodePro implements INode {
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
        this.label = 'Website Audit'
        this.name = 'WebsiteAudit'
        this.version = 1.0
        this.icon = 'aicodepro.svg'
        this.category = 'Aicodepro'
        this.type = 'action'
        this.icon = 'aicodepro.svg'
        this.description = 'Submit a url for auditing a website.'
        this.inputs = []
        this.credential = {
            label: 'Website Audit Credentials',
            name: 'credential',
            type: 'credential',
            credentialNames: ['aicodeproCredentails']
        }
        this.baseClasses = [this.type, ...getBaseClasses(WebisteAudit)]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const tenantId = getCredentialParam('tenantId', credentialData, nodeData)
        const storeId = getCredentialParam('storeId', credentialData, nodeData)
        const aicodeproToken = getCredentialParam('token', credentialData, nodeData)

        if (tenantId && storeId) {
            try {
                console.log(tenantId, storeId)
            } catch (error) {
                throw new Error(`Failed to read Google Search Console credential file: ${error.message}`)
            }
        } else if (aicodeproToken) {
            try {
                console.log(aicodeproToken)
            } catch (error) {
                throw new Error(`Failed to parse Google Search Console credential JSON: ${error.message}`)
            }
        } else {
            throw new Error('Google Search Console credentials (file path or JSON) or IndexNow Key is required.')
        }
        return new WebisteAudit({ tenantId, storeId, aicodeproToken })
    }
}

module.exports = { nodeClass: WebsiteAudit_AiCodePro }
