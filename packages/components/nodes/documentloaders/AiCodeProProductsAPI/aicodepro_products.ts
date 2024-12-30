import { getEnvironmentVariable } from '@langchain/core/utils/env'
import { Tool } from '@langchain/core/tools'

/**
 * Interface for the parameters required to instantiate a AiCodePro Products
 * instance.
 */
export interface AiCodeProProductsParams {
    aicodeproToken?: string
    storeId?: string
    tenantId?: string
    domain?: string
    pageSize?: number
}

/**
 * Class for interacting with the Aicodepro PIM. It extends the Tool
 * class and requires an API key to function. The API key can be passed in
 * during instantiation or set as an environment variable named
 * 'BRAVE_SEARCH_API_KEY'.
 */
export class AiCodeProProducts extends Tool {
    static lc_name() {
        return 'AiCodeProProducts'
    }

    name = 'aicodepro-products'

    description =
        'Product Information Management. useful for when you need to answer questions about products. input should be a search query.'

    aicodeproToken: string
    storeId?: string
    tenantId?: string
    domain?: string
    pageSize?: number

    constructor(
        fields: AiCodeProProductsParams = {
            aicodeproToken: getEnvironmentVariable('AICODEPRO_PRODUCTS_API_KEY')
        }
    ) {
        super()

        if (!fields.aicodeproToken) {
            throw new Error(
                `AiCodePro Products API token not set. Please pass it in or set it as an environment variable named "AICODEPRO_PRODUCTS_API_KEY".`
            )
        }
        if (!fields.storeId) {
            throw new Error('storeId is required. Please provide it as a parameter.')
        }

        if (!fields.tenantId) {
            throw new Error('tenantId is required. Please provide it as a parameter.')
        }

        this.aicodeproToken = fields.aicodeproToken
        this.storeId = fields.storeId
        this.tenantId = fields.tenantId
        this.domain = fields.domain
            ? fields.domain.endsWith('/')
                ? fields.domain.slice(0, -1)
                : fields.domain
            : 'https://api.aicodepro.com'
        this.pageSize = fields.pageSize && fields.pageSize > 0 ? fields.pageSize : 20
    }

    /** @ignore */
    async _call(currentPage: number = 1): Promise<string> {
        if (typeof currentPage !== 'number' || currentPage < 1) {
            throw new Error('currentPage must be a positive number.')
        }
        const headers = {
            Authorization: `Bearer ${this.aicodeproToken}`,
            Accept: 'application/json'
        }

        const url = `${this.domain}/api/product-service/${this.tenantId}/${this.storeId}/channel-products?pagination[page]=${currentPage}&pagination[pageSize]=${this.pageSize}&filters[isListedOnShopify][$eq]=true&locale=en`
        console.log('Fetching products data...', url)
        const response = await fetch(url, {
            method: 'GET',
            headers
        })
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`)
        }
        const parsedResponse = await response.json()
        return JSON.stringify(parsedResponse)
    }
}
