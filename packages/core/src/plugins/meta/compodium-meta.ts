import { type ArrayExpressionElement, type Node, parse as parseAst } from 'oxc-parser'
import { readFile } from 'node:fs/promises'

import type { CompodiumMeta } from '../../types'
import { basename } from 'node:path'

const DEFINE_COMPODIUM_META = 'extendCompodiumMeta'
const unsupportedValue = Symbol('unsupported Compodium metadata value')

function evaluateNode(node: Node | ArrayExpressionElement): any | typeof unsupportedValue {
  if (!node) return unsupportedValue

  const obj: Record<string, any> = {}

  switch (node.type) {
    case 'ObjectExpression':
      for (const prop of node.properties) {
        if (prop.type === 'Property') {
          const key = prop.key.type === 'Identifier' ? prop.key.name : 'value' in prop.key ? prop.key.value?.toString() : undefined
          if (!key) continue
          const value = evaluateNode(prop.value)
          if (value !== unsupportedValue) obj[key] = value
        }
      }
      return obj

    case 'ArrayExpression':
      return node.elements.map(evaluateNode).filter(value => value !== unsupportedValue)

    case 'Literal':
      return node.value

    case 'Identifier':
      return unsupportedValue

    case 'TemplateLiteral':
      if (node.expressions.length) return unsupportedValue
      return node.quasis.map(q => q.value.cooked).join('')

    default:
      return unsupportedValue
  }
}

export async function parseCompodiumMeta(componentPath: string): Promise<CompodiumMeta['compodium'] | null> {
  const { parse: parseSFC } = await import('@vue/compiler-sfc')
  const code = (await readFile(componentPath)).toString()
  const filename = basename(componentPath)

  const sfc = parseSFC(code, { filename })

  const scriptBlock = sfc.descriptor.scriptSetup?.content ?? sfc.descriptor.script?.content
  if (!scriptBlock) return null

  const ast = await parseAst(filename, scriptBlock, { lang: 'ts' })

  for (const statement of ast.program.body) {
    if (statement.type === 'ExpressionStatement' && statement.expression.type === 'CallExpression' && statement.expression.callee.type === 'Identifier' && statement.expression.callee.name === DEFINE_COMPODIUM_META) {
      const callExpression = statement.expression
      const argument = callExpression.arguments?.[0]
      if (!argument || argument.type !== 'ObjectExpression') return null
      return evaluateNode(argument)
    }
  }

  return null
}
