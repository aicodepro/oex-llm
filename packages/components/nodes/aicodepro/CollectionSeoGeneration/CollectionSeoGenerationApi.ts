import { EmbeddingsInterface } from '@langchain/core/embeddings'
import { BaseLanguageModelInterface } from '@langchain/core/language_models/base'
import { Tool } from '@langchain/core/tools'
import { getEnvironmentVariable } from '@langchain/core/utils/env'
import axios from 'axios'

export interface AiCodeProProductParams {
    model?: BaseLanguageModelInterface
    embeddings?: EmbeddingsInterface
    tenantId?: string
    storeId?: string
    assignedToken?: string
    domain?: string
    collectionIds?: string
}

export class CollectionSeoGenerationApi extends Tool {
    static lc_name() {
        return 'CollectionSeoGeneration'
    }

    get lc_secrets(): { [key: string]: string } | undefined {
        return {
            assignedToken: 'ASSIGNED_TOKEN'
        }
    }

    name = 'aicodepro-collection'

    private model: BaseLanguageModelInterface
    private embeddings: EmbeddingsInterface
    protected tenantId: string
    protected storeId: string
    protected assignedToken: string
    protected domain: string
    protected collectionIds: string

    description =
        'Use AiCodePro Collection Api to regenerate collection seo content. Input should be the collection ids. Output will the response in json object.'

    constructor(
        fields: AiCodeProProductParams = {
            assignedToken: getEnvironmentVariable('ASSIGNED_TOKEN')
        }
    ) {
        super(...arguments)
        if (!fields.assignedToken) {
            throw new Error(
                `AiCodePro Products API token not set. Please pass it in or set it as an environment variable named "ASSIGNED_TOKEN".`
            )
        }
        if (!fields.storeId) {
            throw new Error('storeId is required. Please provide it as a parameter.')
        }

        if (!fields.tenantId) {
            throw new Error('tenantId is required. Please provide it as a parameter.')
        }
        if (!fields.model || !fields.embeddings) {
            throw new Error('Model and Embeddings are required')
        }
        this.model = fields.model
        this.embeddings = fields.embeddings
        this.assignedToken = fields.assignedToken
        this.storeId = fields.storeId
        this.tenantId = fields.tenantId
        this.domain = fields.domain
            ? fields.domain.endsWith('/')
                ? fields.domain.slice(0, -1)
                : fields.domain
            : 'https://api.aicodepro.com'
        this.collectionIds = fields.collectionIds as string
    }

    async _call(input: any) {
        if ((!this.tenantId || !this.storeId) && !this.assignedToken) {
            throw new Error('Tenant Id and Store Id or Aicodepro assigned Token are required.')
        }
        if (!this.collectionIds) throw new Error('Collection Ids are required')
        try {
            const collectionIds = this.collectionIds.split(',').map((id) => parseInt(id.trim()))
            const collectionUrl = `${this.domain}/api/product-service/${this.tenantId}/${this.storeId}/product-collections`

            const result = []
            // const collections = []
            // const memory = new BufferMemory();
            // console.log(memory.chatHistory);
            // const vectorStore = new MemoryVectorStore(this.embeddings)
            // console.log(vectorStore.memoryVectors)
            // let collectionHistory = (await vectorStore.similaritySearch('Retrieve all data')).map((searches) =>
            //     JSON.parse(searches.pageContent)
            // )
            // const collectionIdsForSeo = collectionHistory
            //     ? collectionHistory.map((collection) => {
            //           const presentDate = new Date()
            //           const seoUpdateDate = new Date(collection.data.attributes.seoUpdatedAt || collection.data.attributes.updatedAt)

            //           const differenceInHours = (presentDate.getMilliseconds() - seoUpdateDate.getMilliseconds()) / (1000 * 60 * 60)
            //           if (differenceInHours > 48) return collection.collectionId
            //           else return null
            //       })
            //     : collectionIds;

            // for (const collectionId of collectionIds) {
            //     try {
            //         const collectionResponse = await axios.get(`${collectionUrl}/${collectionId}`, {
            //             headers: {
            //                 Authorization: `Bearer ${this.assignedToken}`
            //             }
            //         })
            //         collections.push({
            //             collectionId,
            //             message: `Collection fetched successfully: ${collectionId}`,
            //             data: collectionResponse.data.data
            //         });
            //     } catch (e) {
            //         collections.push({
            //             collectionId,
            //             message: `Not able to get collection with id: ${collectionId}`,
            //             data: 'No data'
            //         })
            //     }
            // }
            // const docs = collections.map(
            //     (collection) =>
            //         new Document({
            //             pageContent: JSON.stringify(collection),
            //             metadata: []
            //         })
            // )

            // vectorStore.addDocuments(docs)
            // console.log((await vectorStore.similaritySearch('Retrieve all data')).map((searches) => JSON.parse(searches.pageContent)))
            // const search = await vectorStore.similaritySearch('Retrieve all data')
            // console.log(
            //     search.forEach((s) => {
            //         console.log(JSON.parse(s.pageContent))
            //     })
            // )

            // collectionHistory = (await vectorStore.similaritySearch('Retrieve all data')).map((searches) =>
            //     JSON.parse(searches.pageContent)
            // )
            for (const collectionId of collectionIds) {
                try {
                    const collection = await axios.get(`${collectionUrl}/${collectionId}`, {
                        headers: {
                            Authorization: `Bearer ${this.assignedToken}`
                        }
                    })
                    if (
                        collection.data.data.attributes.seoGeneration === 'failed' ||
                        (new Date().getMilliseconds() -
                            new Date(
                                collection.data.data.attributes?.seoUpdatedAt
                                    ? collection.data.data.attributes?.seoUpdatedAt
                                    : collection.data.data.attributes.updatedAt
                            ).getMilliseconds()) /
                            (1000 * 60 * 60) >
                            48
                    ) {
                        const response = await axios.put(
                            `${collectionUrl}/generate-seo/${collectionId}?locale=en`,
                            {
                                primaryKeyword: collection.data.data.attributes?.primaryKeyword,
                                secondryKeyword: collection.data.data.attributes?.secondryKeyword,
                                title: collection.data.data.attributes?.title
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${this.assignedToken}`
                                }
                            }
                        )
                        console.log('res:', response.data)
                        result.push({
                            collectionId,
                            type: response.data.type,
                            message: response.data.message
                        })
                    } else {
                        console.log('In else')
                        result.push({
                            collectionId,
                            type: 'Error',
                            message: 'Cannot update collection seo within 48 hour, please try again.'
                        })
                    }
                    console.log('Out')
                } catch (e) {
                    console.log('error', e)
                    result.push({
                        collectionId,
                        type: 'Error',
                        message: `Failed to update content of collection Id: ${collectionId}`
                    })
                }
            }
            return JSON.stringify({
                result
            })
        } catch (error) {
            console.error('Error occurred:', error)
            throw error
        }
    }
}
