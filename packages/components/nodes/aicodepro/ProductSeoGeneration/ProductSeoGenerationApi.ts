import { Tool } from '@langchain/core/tools'
import { getEnvironmentVariable } from '@langchain/core/utils/env'
import axios from 'axios'

export interface AiCodeProProductParams {
    tenantId?: string
    storeId?: string
    assignedToken?: string
    domain?: string
    productIds: string
}

export class ProductSeoGenerationApi extends Tool {
    static lc_name() {
        return 'ProductSeoGeneration'
    }

    get lc_secrets(): { [key: string]: string } | undefined {
        return {
            assignedToken: 'ASSIGNED_TOKEN'
        }
    }

    name = 'aicodepro-product'

    protected tenantId: string
    protected storeId: string
    protected assignedToken: string
    protected domain: string
    protected productIds: string

    description =
        'Use AiCodePro Product Api to regenerate products seo content. Input should be the product ids. Output will the response in json object.'

    constructor(
        fields: AiCodeProProductParams = {
            assignedToken: getEnvironmentVariable('ASSIGNED_TOKEN') || '',
            productIds: ''
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
        this.assignedToken = fields.assignedToken
        this.storeId = fields.storeId
        this.tenantId = fields.tenantId
        this.domain = fields.domain
            ? fields.domain.endsWith('/')
                ? fields.domain.slice(0, -1)
                : fields.domain
            : 'https://api.aicodepro.com'
        this.productIds = fields.productIds as string
    }

    async _call(input: any) {
        if ((!this.tenantId || !this.storeId) && !this.assignedToken) {
            throw new Error('Tenant Id and Store Id or Aicodepro assigned Token are required.')
        }
        if (!this.productIds) throw new Error('Product Ids are required')

        try {
            const productIds = this.productIds.split(',').map((id) => parseInt(id.trim()))
            const channelProductUrl = `${this.domain}/api/product-service/${this.tenantId}/${this.storeId}/channel-products/bulk-seo-regenearte?locale=en`

            const result = await axios.post(
                channelProductUrl,
                {
                    data: {
                        productIds: productIds,
                        seoFields: ['title', 'description'],
                        isChannelProductId: true
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.assignedToken}`
                    }
                }
            )
            return JSON.stringify({
                result: result.data
            })
        } catch (error) {
            console.error('Error occurred:', error)
            throw error
        }
    }
}
