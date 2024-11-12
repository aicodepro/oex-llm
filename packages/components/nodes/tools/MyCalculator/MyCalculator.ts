import { INode } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { MyCalculator } from './core'

class MyCalculator_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]

    constructor() {
        this.label = 'MyCalculator'
        this.name = 'mycalculator'
        this.version = 1.0
        this.type = 'MyCalculator'
        this.icon = 'calculator.svg'
        this.category = 'Tools'
        this.description = 'Perform calculations on response'
        this.baseClasses = [this.type, ...getBaseClasses(MyCalculator)]
    }

    async init() {
        return new MyCalculator()
    }
}

module.exports = { nodeClass: MyCalculator_Tools }
