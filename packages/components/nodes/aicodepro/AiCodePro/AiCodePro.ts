import { INode } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { AiCodePro } from './core'

class AiCodePro_Aicodepro implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]

    constructor() {
        this.label = 'AiCodePro'
        this.name = 'aicodepro'
        this.version = 1.0
        this.type = 'AiCodePro'
        this.icon = 'aicodepro.svg'
        this.category = 'Aicodepro'
        this.description = 'Perform calculations on response'
        this.baseClasses = [this.type, ...getBaseClasses(AiCodePro)]
    }

    async init() {
        return new AiCodePro()
    }
}

module.exports = { nodeClass: AiCodePro_Aicodepro }
