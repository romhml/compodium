import { createCheckerByJson } from 'vue-component-meta'
import type { CompodiumMeta, ComponentsDir } from '../../types'
import { inferPropTypes } from './infer'

// function getType() {
//   const $type = symbolProperties.find(prop => prop.escapedName === 'type')
//
//   if ($type) {
//     const type = typeChecker.getTypeOfSymbolAtLocation($type, symbolNode)
//     return Number(typeChecker.typeToString(type))
//   }
//
//   return 0
// }
//
// function getCompodiumMeta(): Record<string, any> | undefined {
//   const snapshot = language.scripts.get(componentPath)?.snapshot
//   const sourceScript = language.scripts.get(componentPath)
//
//   if (!snapshot || !sourceScript) {
//     console.error('Snapshot or source script not found.')
//     return
//   }
//
//   const vueFile = sourceScript!.generated?.root
//   const ast = vueFile && exportName === 'default'
//     ? (vueFile as vue.VueVirtualCode).sfc.scriptSetup?.ast
//     : ts.createSourceFile(
//         '/tmp.' + componentPath.slice(componentPath.lastIndexOf('.') + 1),
//         snapshot.getText(0, snapshot.getLength()),
//         ts.ScriptTarget.Latest
//       )
//
//   if (!ast) return
//   const identifier = 'extendCompodiumMeta'
//   function traverse(node: ts.Node, parent?: ts.Node): Record<string, any> | undefined {
//     if (!ast) return
//
//     if ((node as any)?.text === identifier && ts.isIdentifier(node)) {
//       const argument = (parent as any)?.arguments?.[0]
//       if (argument && ts.isObjectLiteralExpression(argument)) {
//         return parseObjectLiteralExpression(argument, ast)
//       }
//     }
//     return ts.forEachChild(node, child => traverse(child, node))
//   }
//
//   return traverse(ast)
// }
//
// function parseObjectLiteralExpression(node: ts.Node, ast: ts.SourceFile): any {
//   const printer = ts.createPrinter(checkerOptions.printer)
//
//   // Function to traverse the AST and find the object literal expression
//   function traverse(node: ts.Node): any {
//     if (ts.isObjectLiteralExpression(node)) {
//       // Create a JavaScript object from the object literal expression
//       const obj: any = {}
//       node.properties.forEach((property) => {
//         if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
//           const key = property.name.text
//           const value = evaluateExpression(property.initializer)
//           obj[key] = value
//         }
//       })
//       return obj
//     }
//     return ts.forEachChild(node, traverse)
//   }
//
//   // Function to evaluate expressions (supports literals and arrays)
//   function evaluateExpression(node: ts.Node): any {
//     if (ts.isStringLiteral(node)) {
//       return node.text
//     } else if (ts.isNumericLiteral(node)) {
//       return Number.parseFloat(node.text)
//     } else if (ts.isStringLiteralOrJsxExpression(node)) {
//       return true
//     } else if (ts.isObjectLiteralExpression(node)) {
//       return traverse(node)
//     } else if (ts.isArrayLiteralExpression(node)) {
//       return node.elements.map(element => evaluateExpression(element))
//     } else if (ts.isLiteralTypeLiteral(node)) {
//       if (node.kind === ts.SyntaxKind.TrueKeyword) {
//         return true
//       } else if (node.kind === ts.SyntaxKind.FalseKeyword) {
//         return false
//       } else if (node.kind === ts.SyntaxKind.NullKeyword) {
//         return null
//       } else if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
//         return undefined
//       }
//     }
//
//     console.warn('[Compodium] Could not evaluate meta property:', printer?.printNode(ts.EmitHint.Expression, node, ast))
//   }
//   // Traverse the AST to find and transform the object literal
//   return traverse(node)
// }

export function createChecker(dirs: ComponentsDir[]) {
  const rootDir = process.cwd()
  const metaChecker = createCheckerByJson(
    rootDir,
    {
      extends: `${rootDir}/tsconfig.json`,
      compilerOptions: {
        allowArbitraryExtensions: true // Fixes Nuxt UI component type resolution
      },
      include: [
        '**/*',
        ...dirs?.map((dir: any) => {
          const path = typeof dir === 'string' ? dir : (dir?.path || '')
          const ext = path.split('.').pop()!
          return ['vue', 'ts', 'tsx', 'js', 'jsx'].includes(ext) ? path : `${path}/**/*`
        }) ?? []
      ],
      exclude: ['**/*.vue.d.ts']
    },
    {
      forceUseTs: true,
      schema: {
        ignore: [
          'NuxtComponentMetaNames',
          'RouteLocationRaw',
          'RouteLocationPathRaw',
          'RouteLocationNamedRaw'
        ]
      }
    }
  )

  const checker = {
    ...metaChecker,
    getComponentMeta: (componentPath: string): CompodiumMeta => {
      const meta = metaChecker.getComponentMeta(componentPath)
      return {
        props: meta.props
          .filter((sch: any) => !sch.global)
          .filter(sch => !(/^on[A-Z]/.test(sch.name))) // Filter out event emitters (onXxx pattern)
          .map((sch: any) => stripeTypeScriptInternalTypesSchema(sch, true))
          .map(inferPropTypes),

        compodium: meta.compodium,
        events: meta.events.map((sch: any) => sch.name)
        // exposed: meta.exposed.map(sch => stripeTypeScriptInternalTypesSchema(sch, true)),
        // slots: meta.slots.map(sch => stripeTypeScriptInternalTypesSchema(sch, true))
      }
    }
  }
  return checker
}

export function stripeTypeScriptInternalTypesSchema(type: any, topLevel: boolean = true): any {
  if (!type) {
    return type
  }

  if (type?.name?.startsWith('__')) return false

  if (!topLevel && type.declarations && type.declarations.find((d: any) => d.file.includes('node_modules/typescript') || d.file.includes('@vue/runtime-core'))) {
    return false
  }

  if (Array.isArray(type)) {
    return type.map((sch: any) => stripeTypeScriptInternalTypesSchema(sch, false)).filter(r => r !== false)
  }

  if (Array.isArray(type.schema)) {
    return {
      ...type,
      declarations: undefined,
      schema: type.schema.map((sch: any) => stripeTypeScriptInternalTypesSchema(sch, false)).filter((r: any) => r !== false)
    }
  }

  if (!type.schema || typeof type.schema !== 'object') {
    return typeof type === 'object' ? { ...type, declarations: undefined } : type
  }

  const schema: any = {}
  Object.keys(type.schema).forEach((sch) => {
    if (sch === 'schema' && type.schema[sch]) {
      schema[sch] = schema[sch] || {}
      Object.keys(type.schema[sch]).forEach((sch2) => {
        const res = stripeTypeScriptInternalTypesSchema(type.schema[sch][sch2], false)
        if (res !== false) {
          schema[sch][sch2] = res
        }
      })
      return
    }
    const res = stripeTypeScriptInternalTypesSchema(type.schema[sch], false)

    if (res !== false) {
      schema[sch] = res
    }
  })

  return {
    ...type,
    declarations: undefined,
    schema
  }
}
