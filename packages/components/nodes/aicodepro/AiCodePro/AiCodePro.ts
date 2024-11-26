import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { AicodeproWebBrowser } from './aicodeWebBrowser'
import { BaseLanguageModel } from '@langchain/core/language_models/base'
import { Embeddings } from '@langchain/core/embeddings'

class AiCodePro_Aicodepro implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]
    author: string

    constructor() {
        this.label = 'AiCodePro Browser'
        this.name = 'aicodepro'
        this.version = 1.0
        this.type = 'WebBrowser'
        this.icon = 'aicodepro.svg'
        this.category = 'Aicodepro'
        this.author = 'Devendra Yadav'
        this.description = 'Gives agent the ability to visit a website and extract information'
        this.inputs = [
            {
                label: 'Language Model',
                name: 'model',
                type: 'BaseLanguageModel'
            },
            {
                label: 'Embeddings',
                name: 'embeddings',
                type: 'Embeddings'
            }
        ]
        this.baseClasses = [this.type, ...getBaseClasses(AicodeproWebBrowser)]
    }
    async init(nodeData: INodeData): Promise<any> {
        const model = nodeData.inputs?.model as BaseLanguageModel
        const embeddings = nodeData.inputs?.embeddings as Embeddings
        return new AicodeproWebBrowser({ model, embeddings })
    }
}

module.exports = { nodeClass: AiCodePro_Aicodepro }
