import { Parser } from 'expr-eval'
import { Tool } from '@langchain/core/tools'

export class MyCalculator extends Tool {
    name = 'calculator'
    description = `Useful for getting the result of a math expression. The input to this tool should be a valid mathematical expression that could be executed by a simple calculator.`
    async _call(input: string) {
        try {
            return Parser.evaluate(input).toString()
        } catch (error) {
            return "I don't know how to do that."
        }
    }
}
