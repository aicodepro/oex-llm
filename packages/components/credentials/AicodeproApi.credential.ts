import { INodeParams, INodeCredential } from '../src/Interface'

class AicodeproApi implements INodeCredential {
    label: string
    name: string
    version: number
    inputs: INodeParams[]

    constructor() {
        this.label = 'Aicodepro Credentials'
        this.name = 'aicodeproCredentails'
        this.version = 1.0
        this.inputs = [
            {
                label: 'Tenant ID',
                name: 'tenantId',
                description: 'Your assigned tenant id of Aicodepro',
                placeholder: 'e.g. 142',
                type: 'string'
            },
            {
                label: 'Store ID',
                name: 'storeId',
                description: 'Your assigned tenant id of Aicodepro',
                placeholder: `e.g. 135`,
                type: 'string'
            },
            {
                label: 'Token',
                name: 'token',
                description: 'Assigned token',
                type: 'string'
            }
        ]
    }
}

module.exports = { credClass: AicodeproApi }
