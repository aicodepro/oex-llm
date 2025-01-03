/* eslint-disable prettier/prettier */
import { omit } from 'lodash'
import { ICommonObject, IDocument, INode, INodeData, INodeParams } from '../../../src/Interface'
import { TextSplitter } from 'langchain/text_splitter'
import { AiCodeProProducts } from './aicodepro_products'
import { getCredentialData, getCredentialParam } from '../../../src/utils'
import { Document } from '@langchain/core/documents'

class AiCodeProProductsAPI_DocumentLoaders implements INode {
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
        this.label = 'Products API Document Loader'
        this.name = 'aiCodeProProductsAPILoader'
        this.version = 1.0
        this.type = 'Document'
        this.icon = 'aicodepro.svg'
        // DO Not change the name Category of Document Loaders
        this.category = 'Document Loaders'
        this.description = 'Load and process data from AiCodePro Products results'
        this.baseClasses = [this.type]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            optional: false,
            credentialNames: ['aicodeproCredentails']
        }
        this.inputs = [
            {
                label: 'Website Domain',
                name: 'websiteDomain',
                type: 'string'
            },
            {
                label: 'Fetch Live products',
                name: 'fetchLiveProducts',
                type: 'boolean',
                optional: true
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Additional Metadata',
                name: 'metadata',
                type: 'json',
                description: 'Additional metadata to be added to the extracted documents',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Omit Metadata Keys',
                name: 'omitMetadataKeys',
                type: 'string',
                rows: 4,
                description:
                    'Each document loader comes with a default set of metadata keys that are extracted from the document. You can use this field to omit some of the default metadata keys. The value should be a list of keys, separated by comma. Use * to omit all metadata keys except the ones you specify in the Additional Metadata field',
                placeholder: 'key1, key2, key3.nestedKey1',
                optional: true,
                additionalParams: true
            }
        ]
    }

    structuredAttributeData = (attributes: any) => {
        if (!attributes?.data) return ''
        const attributeString = attributes.data
            .map((item: any) => {
                const attribute = item?.attributes?.product_service_ps_attribute?.data?.attributes?.name
                const value = item?.attributes?.text
                return attribute && value ? `${attribute.toLowerCase()}: ${value.toLowerCase()}` : null
            })
            .filter((item: any) => item !== null)
            .join(', ')
        return attributeString
    }

    channelImagesDataSrc = (images: any) => {
        if (!images?.data) return []

        const imagesSrcArray = images?.data.map((item: any) => {
            const src = item.attributes?.aicodeproImage?.url
            return { url: src }
        })
        return imagesSrcArray.filter((item: any) => item !== null)
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const textSplitter = nodeData.inputs?.textSplitter as TextSplitter
        const websiteDomain = nodeData.inputs?.websiteDomain as string
        const metadata = nodeData.inputs?.metadata
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys as string
        const fetchLiveProducts = nodeData.inputs?.fetchLiveProducts as boolean

        let omitMetadataKeys: string[] = []
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim())
        }

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const aicodeproToken = getCredentialParam('token', credentialData, nodeData)
        const tenantId = getCredentialParam('tenantId', credentialData, nodeData)
        const storeId = getCredentialParam('storeId', credentialData, nodeData)
        let domain = getCredentialParam('domain', credentialData, nodeData)
        if (domain === undefined || domain === '') {
            domain = 'https://api.aicodepro.com'
        }
        if (!aicodeproToken || !tenantId || !storeId) {
            throw new Error('Missing required credentials: token, tenantId, or storeId.')
        }
        const loader = new AiCodeProProducts({
            aicodeproToken: aicodeproToken,
            tenantId: tenantId,
            storeId: storeId,
            domain: domain,
            fetchLiveProducts: fetchLiveProducts
        })

        let docs: IDocument[] = []
        let currentPage = 1
        let hasNextPage = true
        while (hasNextPage) {
            let searchResults
            try {
                searchResults = await loader._call(currentPage)
            } catch (error) {
                throw new Error(`Failed to fetch product data: ${error.message}`)
            }

            const parsedResults = JSON.parse(searchResults)
            if (!parsedResults.data || !Array.isArray(parsedResults.data)) {
                throw new Error('Invalid API response format: "data" field is missing or not an array.')
            }
            const pagination = parsedResults.meta?.pagination
            const newDocs = parsedResults.data
                .map((result: any) => {
                    const attributesData = this.structuredAttributeData(result.attributes?.ps_ms_product_attributes)
                    const channelImagesData = this.channelImagesDataSrc(result.attributes?.product_service_ps_ms_channel_images)
                    if (!attributesData) {
                        console.warn(`Attributes data is undefined for result:`, result)
                        return null // Skip invalid entries
                    }

                    return new Document({
                        pageContent: `Title: ${result.attributes?.title || 'Untitled'}
        SKU: ${result.attributes?.parentSku || 'Not Available'}
        Price: ${result.attributes?.price || 'Not Available'}
        Color: ${result.attributes?.color || 'Not Specified'}
        Description: ${result.attributes?.bodyHtml || ''}
        Tags: ${result.attributes?.tags || 'None'}
        Vendor: ${result.attributes?.vendor || 'Unknown'}
        Image: ${result.attributes?.image?.src || 'Not Available'}
        Product Type: ${result.attributes?.productType || 'Not Categorized'}
        Primary Keywords: ${result.attributes?.primaryKeywords || 'Not Specified'}
        Meta Title: ${result.attributes?.metaTitle || 'Not Specified'}
        Meta Description: ${result.attributes?.metaDescription || 'Not Specified'}
        Secondary Keywords: ${result.attributes?.secondaryKeywords || 'None'}
        Product URL: ${result.attributes?.handle ? `${websiteDomain}/products/${result.attributes?.handle}` : 'Not Available'}
        Product Attributes: ${attributesData || 'Attributes are not available'}`,
                        metadata: {
                            title: result.attributes?.title || 'Untitled',
                            vendor: result.attributes?.vendor,
                            status: result.attributes?.status,
                            tags: result.attributes?.tags,
                            image: result.attributes?.image?.src,
                            price: result.attributes?.price,
                            color: result.attributes?.color,
                            parentSku: result.attributes?.parentSku,
                            primaryKeywords: result.attributes?.primaryKeywords,
                            metaTitle: result.attributes?.metaTitle,
                            metaDescription: result.attributes?.metaDescription,
                            secondaryKeywords: result.attributes?.secondaryKeywords,
                            productType: result.attributes?.productType,
                            quantity: result.attributes?.quantity,
                            mrp: result.attributes?.mrp,
                            size: result.attributes?.size,
                            link: result.attributes?.handle ? `${websiteDomain}/products/${result.attributes.handle}` : null,
                            attributes: attributesData,
                            productImages: channelImagesData
                        }
                    })
                })
                .filter((doc: any) => doc !== null)

            docs.push(...newDocs)
            // Check for pagination end
            hasNextPage = pagination?.pageCount > currentPage
            currentPage++
        }
        docs = docs.filter((doc) => doc?.pageContent && doc?.pageContent.trim())
        // Remove empty docs

        if (textSplitter) {
            docs = await textSplitter.splitDocuments(docs)
        }

        if (metadata) {
            const parsedMetadata = typeof metadata === 'object' ? metadata : JSON.parse(metadata)
            docs = docs.map((doc) => ({
                ...doc,
                metadata:
                    _omitMetadataKeys === '*'
                        ? {
                              ...parsedMetadata
                          }
                        : omit(
                              {
                                  ...doc.metadata,
                                  ...parsedMetadata
                              },
                              omitMetadataKeys
                          )
            }))
        } else {
            docs = docs.map((doc) => ({
                ...doc,
                metadata:
                    _omitMetadataKeys === '*'
                        ? {}
                        : omit(
                              {
                                  ...doc.metadata
                              },
                              omitMetadataKeys
                          )
            }))
        }

        return docs
    }
}

module.exports = { nodeClass: AiCodeProProductsAPI_DocumentLoaders }
