import { parse as parseSFC } from '@vue/compiler-sfc'
import { type ArrayExpressionElement, type Node, parse as parseAst } from 'oxc-parser'
import { readFile } from 'node:fs/promises'

import type { CompodiumMeta } from '../../types'
import { basename } from 'node:path'

const DEFINE_COMPODIUM_META = 'extendCompodiumMeta'

function evaluateNode(node: Node | ArrayExpressionElement): any {
  if (!node) return null

  const obj: Record<string, any> = {}

  switch (node.type) {
    case 'ObjectExpression':
      for (const prop of node.properties) {
        if (prop.type === 'Property') {
          const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value
          obj[key] = evaluateNode(prop.value)
        }
      }
      return obj

    case 'ArrayExpression':
      return node.elements.map(evaluateNode)

    case 'Literal':
      return node.value

    case 'Identifier':
      return node.name

    case 'TemplateLiteral':
      return node.quasis.map(q => q.value.cooked).join('')

    default:
      return null
  }
}

export async function parseCompodiumMeta(componentPath: string): Promise<CompodiumMeta | null> {
  const code = (await readFile(componentPath)).toString()
  const filename = basename(componentPath)

  const sfc = parseSFC(code, { filename })

  const scriptBlock = sfc.descriptor.scriptSetup?.content ?? sfc.descriptor.script?.content
  if (!scriptBlock) return null

  const ast = await parseAst(filename, scriptBlock, { lang: 'ts' })

  for (const statement of ast.program.body) {
    if (statement.type === 'ExpressionStatement' && statement.expression.type === 'CallExpression' && statement.expression.callee.type === 'Identifier' && statement.expression.callee.name === DEFINE_COMPODIUM_META) {
      const callExpression = statement.expression
      if (callExpression.arguments && callExpression.arguments.length > 0) {
        return evaluateNode(callExpression.arguments[0])
      }
    }
  }

  return null
}
