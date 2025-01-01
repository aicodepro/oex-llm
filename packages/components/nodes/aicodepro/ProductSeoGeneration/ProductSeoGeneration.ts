import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getAiCodeProCredentials, getBaseClasses } from '../../../src/utils'
import { ProductSeoGenerationApi } from './ProductSeoGenerationApi'

class ProductSeoGeneration_AiCodePro implements INode {
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
        this.label = 'Product SEO Generation'
        this.name = 'productSeoGeneration'
        this.version = 1.0
        this.icon = 'aicodepro.svg'
        this.category = 'Aicodepro'
        this.type = 'action'
        this.icon = 'aicodepro.svg'
        this.description = 'Submit a product ids for seo content regeneration.'
        this.inputs = [
            {
                label: 'Product Ids',
                name: 'productIds',
                type: 'string',
                rows: 2,
                placeholder: `1320, 1421, ...`
            },
            {
                label: 'Channel',
                name: 'channel',
                type: 'string',
                placeholder: `e.g. Shopify, Amazon, etc.`
            },
            {
                label: 'Primary Keywords',
                name: 'primaryKeywords',
                type: 'string',
                placeholder: `Enter primary keywords for products`,
                optional: true
            },
            {
                label: 'Secondary Keywords',
                name: 'secondaryKeywords',
                type: 'string',
                placeholder: `Enter secondary keywords for products`,
                optional: true
            }
        ]
        this.credential = {
            label: 'AiCodePro Credentials',
            name: 'credential',
            type: 'credential',
            credentialNames: ['aicodeproCredentails']
        }
        this.baseClasses = [this.type, ...getBaseClasses(ProductSeoGenerationApi)]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const productIds = nodeData.inputs?.productIds as string
        const { tenantId, storeId, assignedToken, domain } = await getAiCodeProCredentials(nodeData, options)

        if (!assignedToken || !tenantId || !storeId) {
            throw new Error('Missing required credentials: token, tenantId, or storeId.')
        }

        return new ProductSeoGenerationApi({ tenantId, storeId, assignedToken, domain, productIds })
    }
}

module.exports = { nodeClass: ProductSeoGeneration_AiCodePro }
