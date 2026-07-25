import { NodeTypes, parse, type ElementNode, type RootNode, type TemplateChildNode } from '@vue/compiler-dom'
import { camelCase, kebabCase, pascalCase } from 'scule'
import { escapeString } from 'knitwork'
import deepEqual from 'deep-eql'

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

function parseComponentSource(code: string) {
  let hasError = false
  const root = parse(code, {
    onError: () => {
      hasError = true
    }
  })
  return hasError ? undefined : root
}

function findComponent(root: RootNode | ElementNode, names: Set<string>): ElementNode | undefined {
  for (const child of root.children as TemplateChildNode[]) {
    if (child.type !== NodeTypes.ELEMENT) continue
    if (names.has(child.tag)) return child
    const match = findComponent(child, names)
    if (match) return match
  }
}

function isWhitespace(char: string | undefined) {
  return char === ' ' || char === '\n' || char === '\r' || char === '\t'
}

function getPropName(prop: ElementNode['props'][number]) {
  if (prop.type === NodeTypes.ATTRIBUTE) return prop.name
  if (prop.name !== 'bind' || !prop.arg || prop.arg.type !== NodeTypes.SIMPLE_EXPRESSION || !prop.arg.isStatic) return
  return prop.arg.content
}

function getPropValue(prop: ElementNode['props'][number]) {
  if (prop.type === NodeTypes.ATTRIBUTE) return prop.value?.content ?? true
  return prop.exp?.type === NodeTypes.SIMPLE_EXPRESSION ? prop.exp.content : true
}

export function genPropValue(value: any): string {
  if (typeof value === 'string') {
    return `'${escapeString(value).replaceAll('\'', '&apos;').replaceAll('"', '&quot;')}'`
  }
  if (value instanceof Date) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')

    const dateString = `${year}-${month}-${day}`
    return `new Date('${dateString}')`
  }
  if (Array.isArray(value)) {
    return `[ ${value.map(item => `${genPropValue(item)}`).join(',')} ]`
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value).map(([key, val]) => `${key}: ${genPropValue(val)}`)
    return `{ ${entries.join(`,`)} }`
  }
  return value
}

export function generatePropsTemplate(props?: Record<string, any>, defaultProps?: Record<string, any>) {
  return Object.entries(props ?? {})?.map(([key, value]: [string, any]) => {
    const defaultValue: any = defaultProps?.[key]

    if (defaultValue === value) return
    if (value === true) return kebabCase(key)
    if (value === false && defaultValue === true) return `:${kebabCase(key)}="false"`
    if (!value) return
    if (typeof value === 'string') return `${kebabCase(key)}=${genPropValue(value)}`
    if (deepEqual(defaultValue, value)) return
    return `:${kebabCase(key)}="${genPropValue(value)}"`
  }).filter(Boolean).join('\n')
}

export function generateComponentCode(componentName: string, props?: Record<string, any>, defaultProps?: Record<string, any>) {
  const propsTemplate = generatePropsTemplate(props, defaultProps)
  return `<${pascalCase(componentName)} ${propsTemplate} />`
}

export function parseExistingProps(componentName: string, code: string) {
  const root = parseComponentSource(code)
  if (!root) return {}
  const component = findComponent(root, new Set([pascalCase(componentName), kebabCase(componentName)]))
  if (!component) return {}

  return Object.fromEntries(component.props.flatMap((prop) => {
    const name = getPropName(prop)
    return name ? [[name, getPropValue(prop)]] : []
  }))
}

export function updateComponentCode(componentName: string, code: string, props?: Record<string, any>, defaultProps?: Record<string, any>) {
  const propsTemplate = generatePropsTemplate(props, defaultProps)
  const root = parseComponentSource(code)
  if (!root) return code
  const component = findComponent(root, new Set([pascalCase(componentName), kebabCase(componentName)]))
  if (!component) return code

  const existingProps = Object.fromEntries(component.props.flatMap((prop) => {
    const name = getPropName(prop)
    return name ? [[name, getPropValue(prop)]] : []
  }))
  const propsToRemove = new Set(Object.keys(existingProps).filter(key => !props || props[camelCase(key)] !== undefined))
  const tagNameEnd = component.loc.start.offset + component.tag.length + 1
  const edits: TextEdit[] = [{
    start: tagNameEnd,
    end: tagNameEnd,
    content: ` ${propsTemplate}`
  }]

  for (const prop of component.props) {
    const name = getPropName(prop)
    const isAttrsBinding = prop.type === NodeTypes.DIRECTIVE
      && prop.name === 'bind'
      && !prop.arg
      && prop.exp?.type === NodeTypes.SIMPLE_EXPRESSION
      && prop.exp.content === '$attrs'

    if (!isAttrsBinding && (!name || !propsToRemove.has(name))) continue

    let start = prop.loc.start.offset
    while (start > tagNameEnd && isWhitespace(code[start - 1])) start--
    edits.push({ start, end: prop.loc.end.offset })
  }

  return applyTextEdits(code, edits)
}
