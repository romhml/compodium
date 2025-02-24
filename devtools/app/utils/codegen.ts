import { camelCase, kebabCase, pascalCase } from 'scule'
import { escapeString } from 'knitwork'

// TODO: Might want to use vue/language-tools to refactor this and get rid of horrible RegExp.
export function genPropValue(value: any): string {
  if (typeof value === 'string') {
    return `'${escapeString(value).replace(/'/g, '&apos;').replace(/"/g, '&quot;')}'`
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
    return `:${kebabCase(key)}="${genPropValue(value)}"`
  }).filter(Boolean).join('\n')
}

export function generateComponentCode(componentName: string, props?: Record<string, any>, defaultProps?: Record<string, any>) {
  const propsTemplate = generatePropsTemplate(props, defaultProps)
  return `<${pascalCase(componentName)} ${propsTemplate} />`
}

export function parseExistingProps(componentName: string, code: string) {
  const propRegex = new RegExp(`<${pascalCase(componentName)}\\s+([^>]*[^/])/?>|<${kebabCase(componentName)}\\s+([^>]*[^/])/?>`, 's')
  const match = code.match(propRegex)
  if (!match) return {}

  const propString = match[1] ?? match[2]
  if (!propString) return {}
  const propEntries = propString.split(/\s(?=(?:[^"]*"[^"]*")*[^"]*$)/g)
  const parsedProps = propEntries.flatMap((prop: any) => {
    const match = prop.match(/:?(\S+)="([^"]*)"/)
    if (match) {
      return [[match[1], match[2]]]
    }
    if (prop.trim()?.length) {
      return [[prop, true]]
    }
    return []
  })
  return Object.fromEntries(parsedProps)
}

export function updateComponentCode(componentName: string, code: string, props?: Record<string, any>, defaultProps?: Record<string, any>) {
  const propsTemplate = generatePropsTemplate(props, defaultProps)

  const existingProps = parseExistingProps(componentName, code)
  const propsToRemove = Object.keys(existingProps).filter(key => !props || props?.[camelCase(key)] !== undefined)
  const removePropsRegex = propsToRemove?.length ? new RegExp(`\\s+:?(${propsToRemove.join('|')})(?:="[^"]*")?`, 'g') : ''

  const pascalComponentRegexp = new RegExp(`<${pascalCase(componentName)}(\\s|\\r|>)`)
  const kebabComponentRegexp = new RegExp(`<${kebabCase(componentName)}(\\s|\\r|>)`)

  return code
    .replace(removePropsRegex, '')
    .replace(pascalComponentRegexp, `<${pascalCase(componentName)} ${propsTemplate}$1`)
    .replace(kebabComponentRegexp, `<${kebabCase(componentName)} ${propsTemplate}$1`)
    .replace('v-bind="$attrs"', '')
}
