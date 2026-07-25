import type { VitePlugin } from 'unplugin'
import type { PluginOptions } from '@compodium/core'
import { NodeTypes, parse as parseHtml, type ElementNode, type RootNode, type TemplateChildNode } from '@vue/compiler-dom'
import { parse as parseAst, type CallExpression, type Node } from 'oxc-parser'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { joinURL } from 'ufo'
import { resolvePathSync } from 'mlly'

interface TextEdit {
  start: number
  end: number
  content: string
}

function applyTextEdits(source: string, edits: TextEdit[]) {
  return edits
    .toSorted((a, b) => b.start - a.start || b.end - a.end)
    .reduce((result, edit) => `${result.slice(0, edit.start)}${edit.content}${result.slice(edit.end)}`, source)
}

function visitElements(root: RootNode | ElementNode, visit: (node: ElementNode) => boolean | undefined): ElementNode | undefined {
  for (const child of root.children as TemplateChildNode[]) {
    if (child.type !== NodeTypes.ELEMENT) continue
    if (visit(child)) return child
    const match = visitElements(child, visit)
    if (match) return match
  }
}

function findElement(root: RootNode, predicate: (node: ElementNode) => boolean) {
  return visitElements(root, node => predicate(node))
}

function getAttribute(node: ElementNode, name: string) {
  const attribute = node.props.find(prop => prop.type === NodeTypes.ATTRIBUTE && prop.name.toLowerCase() === name)
  return attribute?.type === NodeTypes.ATTRIBUTE ? attribute.value?.content : undefined
}

function walkAst(value: unknown, visit: (node: Node) => void) {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    for (const child of value) walkAst(child, visit)
    return
  }

  const record = value as Record<string, unknown>
  if (typeof record.type === 'string' && typeof record.start === 'number' && typeof record.end === 'number') {
    visit(value as Node)
  }

  for (const child of Object.values(record)) walkAst(child, visit)
}

function replaceCallArguments(source: string, call: CallExpression, content: string): TextEdit {
  const openingParen = source.indexOf('(', call.callee.end)
  const closingParen = source.lastIndexOf(')', call.end - 1)
  if (openingParen === -1 || closingParen < openingParen || closingParen >= call.end) {
    throw new Error('[Compodium] Failed to locate call arguments')
  }
  return { start: openingParen + 1, end: closingParen, content }
}

function editsOverlap(first: TextEdit, second: TextEdit) {
  return first.start < second.end && second.start < first.end
}

export function inferMainPath(indexContent: string) {
  const document = parseHtml(indexContent)
  let mainPath: string | undefined

  visitElements(document, (node) => {
    if (node.tag.toLowerCase() !== 'script') return
    const src = getAttribute(node, 'src')
    if (!src || src.startsWith('http://') || src.startsWith('https://')) return
    mainPath = src.startsWith('/') ? `.${src}` : src
    return true
  })

  return mainPath
}

export function renderRendererIndex(indexContent: string, baseUrl: string) {
  const document = parseHtml(indexContent)
  const body = findElement(document, node => node.tag.toLowerCase() === 'body')
  if (!body) throw new Error('[Compodium] Could not find <body> in index.html')

  return applyTextEdits(indexContent, [{
    start: body.loc.start.offset,
    end: body.loc.end.offset,
    content: `<body>
              <div id="compodium"></div>
              <script type="module" src="${joinURL(baseUrl, '/@compodium/renderer.ts')}"></script>
            </body>`
  }])
}

export async function transformMainModule(filename: string, source: string) {
  const parsed = await parseAst(filename, source)
  const [parseError] = parsed.errors
  if (parseError) {
    throw new Error(`[Compodium] Failed to parse Vue entrypoint ${filename}: ${parseError.message}`)
  }

  const createAppNames = new Set(['createApp'])
  const edits: TextEdit[] = []

  for (const statement of parsed.program.body) {
    if (statement.type === 'ImportDeclaration' && statement.source.value === 'vue') {
      for (const specifier of statement.specifiers) {
        if (specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier' && specifier.imported.name === 'createApp') {
          createAppNames.add(specifier.local.name)
        }
      }
    }

    if ((statement.type === 'ImportDeclaration' || statement.type === 'ExportAllDeclaration' || statement.type === 'ExportNamedDeclaration')
      && statement.source?.value?.startsWith('.')) {
      edits.push({
        start: statement.source.start,
        end: statement.source.end,
        content: JSON.stringify(resolve(dirname(filename), statement.source.value))
      })
    }
  }

  let createAppCall: CallExpression | undefined
  const mountCalls: CallExpression[] = []
  walkAst(parsed.program, (node) => {
    if (node.type !== 'CallExpression') return
    if (!createAppCall && node.callee.type === 'Identifier' && createAppNames.has(node.callee.name)) {
      createAppCall = node
    }
    if (node.callee.type === 'MemberExpression'
      && !node.callee.computed
      && node.callee.property.type === 'Identifier'
      && node.callee.property.name === 'mount') {
      mountCalls.push(node)
    }
  })

  const createAppEdit = createAppCall ? replaceCallArguments(source, createAppCall, 'CompodiumRoot') : undefined
  if (createAppEdit) edits.push(createAppEdit)

  let appName: string | undefined
  if (createAppCall) {
    const createAppStart = createAppCall.start
    const createAppEnd = createAppCall.end
    for (const statement of parsed.program.body) {
      if (statement.type !== 'VariableDeclaration') continue
      const declaration = statement.declarations.find(item => item.init?.start === createAppStart && item.init?.end === createAppEnd)
      if (declaration?.id.type === 'Identifier') appName = declaration.id.name
    }
  }

  const mountCall = mountCalls.find(call => appName
    && call.callee.type === 'MemberExpression'
    && call.callee.object.type === 'Identifier'
    && call.callee.object.name === appName)
  ?? mountCalls.find(call => createAppCall
    && call.callee.type === 'MemberExpression'
    && call.callee.object.start <= createAppCall.start
    && call.callee.object.end >= createAppCall.end)

  if (mountCall) {
    const mountEdit = replaceCallArguments(source, mountCall, '"#compodium"')
    if (!createAppEdit || !editsOverlap(createAppEdit, mountEdit)) edits.push(mountEdit)
  }

  return applyTextEdits(source, edits)
}

export function rendererPlugin(options: PluginOptions): VitePlugin {
  let rootDir: string
  let index: string
  let mainPath: string
  let baseUrl: string

  return {
    name: 'compodium:renderer',
    enforce: 'pre',
    apply: 'serve',
    configResolved(viteConfig) {
      rootDir = options.rootDir ?? viteConfig.root
      baseUrl = options.baseUrl ?? viteConfig.base

      index = readFileSync(resolve(rootDir, 'index.html'), 'utf-8')
      const inferredMainPath = inferMainPath(index)
      mainPath = resolve(rootDir, (options.mainPath ?? inferredMainPath) as string)
    },

    configureServer(server) {
      server.middlewares.use('/__compodium__/renderer', async (_req, res) => {
        try {
          const rendererIndex = renderRendererIndex(index, baseUrl)
          res.setHeader('Content-Type', 'text/html')
          res.end(rendererIndex)
        } catch {
          res.statusCode = 500
          res.end('Internal Server Error')
        }
      })
    },
    resolveId(id) {
      if (id === '/@compodium/renderer.ts') {
        return '\0@compodium/renderer.ts'
      }
    },
    async load(id) {
      if (id === '\0@compodium/renderer.ts') {
        // Read the user's main entrypoint file
        if (!mainPath) {
          throw new Error('[Compodium] Could not infer main script path. Use the mainPath option to specify the path to your Vue script file containing createApp().')
        }

        if (!existsSync(mainPath)) {
          throw new Error(`[Compodium] failed to resolve main file ${mainPath}. Use the mainPath option to specify the path to your Vue script file containing createApp().`)
        }

        const mainContent = await transformMainModule(mainPath, readFileSync(mainPath, 'utf-8'))

        const rootVuePath = resolvePathSync('@compodium/core/runtime/root.vue', { extensions: ['.vue'], url: import.meta.url })
        return `import CompodiumRoot from '${rootVuePath}';\n${mainContent}`
      }
    }
  }
}
