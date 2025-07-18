import { basename, dirname, extname, join, relative } from 'pathe'
import { glob } from 'tinyglobby'
import { kebabCase, pascalCase, splitByCase } from 'scule'
import { withTrailingSlash } from 'ufo'
import type { Component, ComponentsDir } from '../types'
import { realpath } from 'node:fs/promises'

/* Nuxt internal functions used to scan example components without adding them to the application */

const ISLAND_RE = /\.island(?:\.global)?$/
const COMPONENT_MODE_RE = /(?<=\.)(client|server)(\.global|\.island)*$/
const MODE_REPLACEMENT_RE = /(\.(client|server))?(\.global|\.island)*$/
export const QUOTE_RE = /["']/g

export function resolveComponentNameSegments(fileName: string, prefixParts: string[]) {
  /**
   * Array of fileName parts split by case, / or -
   * @example third-component -> ['third', 'component']
   * @example AwesomeComponent -> ['Awesome', 'Component']
   */
  const fileNameParts = splitByCase(fileName)
  const fileNamePartsContent = fileNameParts.join('/').toLowerCase()
  const componentNameParts: string[] = prefixParts.flatMap(p => splitByCase(p))
  let index = prefixParts.length - 1
  const matchedSuffix: string[] = []
  while (index >= 0) {
    const prefixPart = prefixParts[index]!
    matchedSuffix.unshift(...splitByCase(prefixPart).map(p => p.toLowerCase()))
    const matchedSuffixContent = matchedSuffix.join('/')
    if ((fileNamePartsContent === matchedSuffixContent || fileNamePartsContent.startsWith(matchedSuffixContent + '/'))
      // e.g Item/Item/Item.vue -> Item
      || (prefixPart.toLowerCase() === fileNamePartsContent
        && prefixParts[index + 1]
        && prefixParts[index] === prefixParts[index + 1])) {
      componentNameParts.length = index
    }
    index--
  }
  return [...componentNameParts, ...fileNameParts]
}

/**
 * Scan the components inside different components folders
 * and return a unique list of components
 * @param dirs all folders where components are defined
 * @returns {Promise} Component found promise
 */
export async function scanComponents(dirs: ComponentsDir[]): Promise<Component[]> {
  // All scanned components
  const components: Component[] = []

  // Keep resolved path to avoid duplicates
  const filePaths = new Set<string>()

  // All scanned paths
  const scannedPaths: string[] = []

  for (const dir of dirs) {
    // A map from resolved path to component name (used for making duplicate warning message)
    const resolvedNames = new Map<string, string>()

    const files = (await glob(dir.pattern!, { cwd: dir.path, ignore: dir.ignore })).sort()

    for (const _file of files) {
      const filePath = join(dir.path, _file)

      if (scannedPaths.find(d => filePath.startsWith(withTrailingSlash(d)))) {
        continue
      }

      // Avoid duplicate paths
      if (filePaths.has(filePath)) continue

      filePaths.add(filePath)

      /**
       * Create an array of prefixes base on the prefix config
       * Empty prefix will be an empty array
       * @example prefix: 'nuxt' -> ['nuxt']
       * @example prefix: 'nuxt-test' -> ['nuxt', 'test']
       */
      const prefixParts = ([] as string[]).concat(
        dir.prefix ? splitByCase(dir.prefix) : [],
        (dir.pathPrefix !== false) ? splitByCase(relative(dir.path, dirname(filePath))) : []
      )

      /**
       * In case we have index as filename the component become the parent path
       * @example third-components/index.vue -> third-component
       * if not take the filename
       * @example third-components/Awesome.vue -> Awesome
       */
      let fileName = basename(filePath, extname(filePath))

      const island = ISLAND_RE.test(fileName)
      const mode = island ? 'server' : (fileName.match(COMPONENT_MODE_RE)?.[1] || 'all') as 'client' | 'server' | 'all'
      fileName = fileName.replace(MODE_REPLACEMENT_RE, '')

      if (fileName.toLowerCase() === 'index') {
        fileName = dir.pathPrefix === false ? basename(dirname(filePath)) : '' /* inherits from path */
      }

      const suffix = (mode !== 'all' ? `-${mode}` : '')
      const componentNameSegments = resolveComponentNameSegments(fileName.replace(QUOTE_RE, ''), prefixParts)
      const pascalName = pascalCase(componentNameSegments)

      if (resolvedNames.has(pascalName + suffix) || resolvedNames.has(pascalName)) {
        warnAboutDuplicateComponent(pascalName, filePath, resolvedNames.get(pascalName) || resolvedNames.get(pascalName + suffix)!)
        continue
      }
      resolvedNames.set(pascalName + suffix, filePath)

      const kebabName = kebabCase(componentNameSegments)

      const component: Partial<Component> = {
        mode,
        filePath,
        realPath: await realpath(filePath),
        pascalName,
        kebabName
      }

      // Ignore files like `~/components/index.vue` which end up not having a name at all
      if (!pascalName) {
        console.warn(`[Compodium] Component did not resolve to a file name in \`${filePath}\`.`)
        continue
      }

      const existingComponent = components.find(c => c.pascalName === component.pascalName && ['all', component.mode].includes(c.mode))
      // Ignore component if component is already defined (with same mode)
      if (existingComponent) {
        const existingPriority = existingComponent.priority ?? 0
        const newPriority = component.priority ?? 0

        // Replace component if priority is higher
        if (newPriority > existingPriority) {
          components.splice(components.indexOf(existingComponent), 1, component as Component)
        }
        // Warn if a user-defined (or prioritized) component conflicts with a previously scanned component
        if (newPriority > 0 && newPriority === existingPriority) {
          warnAboutDuplicateComponent(pascalName, filePath, existingComponent.filePath)
        }

        continue
      }

      components.push(component as Component)
    }
    scannedPaths.push(dir.path)
  }

  return components
}

function warnAboutDuplicateComponent(componentName: string, filePath: string, duplicatePath: string) {
  console.warn(`[Compodium] Two component files resolving to the same name \`${componentName}\`:\n`
    + `\n - ${filePath}`
    + `\n - ${duplicatePath}`
  )
}
