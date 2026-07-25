import fs from 'node:fs/promises'

import type { VitePlugin } from 'unplugin'
import type { Collection, PluginOptions } from '../types'
import { resolveCollections } from './collections'
import { getRealPath, isPathInside } from './utils'

import type { SFCScriptBlock } from '@vue/compiler-sfc'
import { parse as parseSFC } from '@vue/compiler-sfc'
import { parse as parseAst } from 'oxc-parser'

interface TextEdit {
  start: number
  end: number
  content?: string
}

function applyTextEdits(source: string, edits: TextEdit[]) {
  return edits
    .toSorted((a, b) => b.start - a.start || b.end - a.end)
    .reduce((result, edit) => `${result.slice(0, edit.start)}${edit.content ?? ''}${result.slice(edit.end)}`, source)
}

async function transformScript(filename: string, source: string, lang: SFCScriptBlock['lang'], removeVueImport: boolean) {
  let parserLang: 'js' | 'jsx' | 'ts' | 'tsx'
  switch (lang) {
    case undefined:
    case 'js':
      parserLang = 'js'
      break
    case 'jsx':
    case 'ts':
    case 'tsx':
      parserLang = lang
      break
    default:
      return source
  }

  const parsed = await parseAst(filename, source, { lang: parserLang })

  const [parseError] = parsed.errors
  if (parseError) {
    throw new Error(`[Compodium] Failed to parse example script in ${filename}: ${parseError.message}`)
  }

  const edits: TextEdit[] = []
  for (const statement of parsed.program.body) {
    const isCompodiumMetaCall = statement.type === 'ExpressionStatement'
      && statement.expression.type === 'CallExpression'
      && statement.expression.callee.type === 'Identifier'
      && statement.expression.callee.name === 'extendCompodiumMeta'

    const isVueImport = removeVueImport
      && statement.type === 'ImportDeclaration'
      && statement.source.value === 'vue'

    if (isCompodiumMetaCall || isVueImport) {
      edits.push({ start: statement.start, end: statement.end })
    }
  }

  return applyTextEdits(source, edits)
}

function getOpeningTagStart(source: string, contentStart: number) {
  let quote: '"' | '\'' | undefined
  for (let index = contentStart - 2; index >= 0; index--) {
    const char = source[index]
    if (char === '"' || char === '\'') {
      quote = quote === char ? undefined : quote ?? char
    } else if (char === '<' && !quote) {
      return index
    }
  }
  return -1
}

function getScriptBlockRange(source: string, block: SFCScriptBlock) {
  const start = getOpeningTagStart(source, block.loc.start.offset)
  const closingTagEnd = source.indexOf('>', block.loc.end.offset)

  if (start === -1 || closingTagEnd === -1 || !source.startsWith('<script', start)) {
    throw new Error('[Compodium] Failed to locate example script block')
  }

  return { start, end: closingTagEnd + 1 }
}

export async function transformExampleCode(filename: string, source: string, removeVueImport = false) {
  const { descriptor, errors } = parseSFC(source, { filename })
  if (errors.length) {
    throw new Error(`[Compodium] Failed to parse example component ${filename}`)
  }

  const edits: TextEdit[] = []
  for (const block of [descriptor.script, descriptor.scriptSetup]) {
    if (!block) continue

    const transformed = await transformScript(filename, block.content, block.lang, removeVueImport)
    if (transformed.trim()) {
      edits.push({
        start: block.loc.start.offset,
        end: block.loc.end.offset,
        content: transformed
      })
    } else {
      edits.push(getScriptBlockRange(source, block))
    }
  }

  return applyTextEdits(source, edits)
}

export function examplePlugin(options: PluginOptions): VitePlugin {
  let collections: Collection[]

  return {
    name: 'compodium:examples',
    apply: 'serve',

    configResolved(viteConfig) {
      collections = resolveCollections(options, viteConfig)
    },

    async configureServer(server) {
      const allowedRoots = await Promise.all(
        collections.flatMap(c => c.exampleDirs.map(dir => getRealPath(dir.path)))
      )
      server.middlewares.use('/__compodium__/api/example', async (req, res) => {
        try {
          const url = new URL(req.url!, `http://${req.headers.host}`)
          const requestedPath = url.searchParams.get('path')

          if (!requestedPath) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Example path is required' }))
            return
          }

          const canonicalPath = await getRealPath(requestedPath)
          if (!allowedRoots.some(root => isPathInside(canonicalPath, root))) {
            res.statusCode = 403
            res.end(JSON.stringify({ error: 'Forbidden' }))
            return
          }

          const exampleCode = await fs.readFile(canonicalPath, 'utf-8')
          const result = await transformExampleCode(canonicalPath, exampleCode, options._nuxt)

          res.setHeader('Content-Type', 'text/plain')
          res.end(result)
        } catch {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Failed to fetch example code' }))
        }
      })
    }
  }
}
