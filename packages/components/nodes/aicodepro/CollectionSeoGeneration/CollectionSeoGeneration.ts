import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getAiCodeProCredentials, getBaseClasses } from '../../../src/utils'
import { CollectionSeoGenerationApi } from './CollectionSeoGenerationApi'
class CollectionSeoGeneration_AiCodePro implements INode {
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
        this.label = 'Collection SEO Generation'
        this.name = 'collectionSeoGeneration'
        this.version = 1.0
        this.icon = 'aicodepro.svg'
        this.category = 'Aicodepro'
        this.type = 'action'
        this.icon = 'aicodepro.svg'
        this.description = 'Submit a collection ids for their seo content regeneration.'
        this.inputs = [
            {
                label: 'Collection Ids',
                name: 'collectionIds',
                type: 'string',
                placeholder: '1,2,12,..'
            }
            // {
            //     label: 'Language Model',
            //     name: 'model',
            //     type: 'BaseLanguageModel'
            // },
            // {
            //     label: 'Embeddings',
            //     name: 'embeddings',
            //     type: 'Embeddings'
            // }
        ]
        this.credential = {
            label: 'AiCodePro Credentials',
            name: 'credential',
            type: 'credential',
            credentialNames: ['aicodeproCredentails']
        }
        this.baseClasses = [this.type, ...getBaseClasses(CollectionSeoGenerationApi)]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const collectionIds = nodeData.inputs?.collectionIds
        // const model = nodeData.inputs?.model as BaseLanguageModel
        // const embeddings = nodeData.inputs?.embeddings as Embeddings
        const { tenantId, storeId, assignedToken, domain } = await getAiCodeProCredentials(nodeData, options)

        if (!assignedToken || !tenantId || !storeId) {
            throw new Error('Missing required credentials: token, tenantId, or storeId.')
        }

        if (!collectionIds) {
            throw new Error('Collection Ids are required')
        }
        return new CollectionSeoGenerationApi({ tenantId, storeId, assignedToken, domain, collectionIds })
    }
}

module.exports = { nodeClass: CollectionSeoGeneration_AiCodePro }
