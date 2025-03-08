import { readdir } from 'node:fs/promises'
import { basename, dirname, extname, join, relative } from 'pathe'
import { glob } from 'tinyglobby'
import { kebabCase, pascalCase, splitByCase } from 'scule'
import { isIgnored, useNuxt } from '@nuxt/kit'
import micromatch from 'micromatch'
import { withTrailingSlash } from 'ufo'
import type { Component, ComponentsDir } from 'nuxt/schema'

import type { Collection, CollectionConfig } from '../types'

export function getComponentCollection<T = Collection | CollectionConfig>(component: Component, collections: T[]) {
  return collections.find((c: any) => {
    if (!c.external && component.filePath?.match('node_modules/')) return false
    return micromatch.isMatch(component.filePath, [c.path], { contains: true })
  })
}

/* Nuxt internal functions used to scan example components without adding them to the application */

const ISLAND_RE = /\.island(?:\.global)?$/
const GLOBAL_RE = /\.global(?:\.island)?$/
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
 * @param srcDir src path of your app
 * @returns {Promise} Component found promise
 */
export async function scanComponents(dirs: ComponentsDir[], srcDir: string): Promise<Component[]> {
  // All scanned components
  const components: Component[] = []

  // Keep resolved path to avoid duplicates
  const filePaths = new Set<string>()

  // All scanned paths
  const scannedPaths: string[] = []

  for (const dir of dirs) {
    if (dir.enabled === false) {
      continue
    }
    // A map from resolved path to component name (used for making duplicate warning message)
    const resolvedNames = new Map<string, string>()

    const files = (await glob(dir.pattern!, { cwd: dir.path, ignore: dir.ignore })).sort()

    // Check if the directory exists (globby will otherwise read it case insensitively on MacOS)
    if (files.length) {
      const siblings = await readdir(dirname(dir.path)).catch(() => [] as string[])

      const directory = basename(dir.path)
      if (!siblings.includes(directory)) {
        const directoryLowerCase = directory.toLowerCase()
        const caseCorrected = siblings.find(sibling => sibling.toLowerCase() === directoryLowerCase)
        if (caseCorrected) {
          const nuxt = useNuxt()
          const original = relative(nuxt.options.srcDir, dir.path)
          const corrected = relative(nuxt.options.srcDir, join(dirname(dir.path), caseCorrected))
          console.warn(`[Compodium] Components not scanned from \`~/${corrected}\`. Did you mean to name the directory \`~/${original}\` instead?`)
          continue
        }
      }
    }

    for (const _file of files) {
      const filePath = join(dir.path, _file)

      if (scannedPaths.find(d => filePath.startsWith(withTrailingSlash(d))) || isIgnored(filePath)) {
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

      const island = ISLAND_RE.test(fileName) || dir.island
      const global = GLOBAL_RE.test(fileName) || dir.global
      const mode = island ? 'server' : (fileName.match(COMPONENT_MODE_RE)?.[1] || 'all') as 'client' | 'server' | 'all'
      fileName = fileName.replace(MODE_REPLACEMENT_RE, '')

      if (fileName.toLowerCase() === 'index') {
        fileName = dir.pathPrefix === false ? basename(dirname(filePath)) : '' /* inherits from path */
      }

      const suffix = (mode !== 'all' ? `-${mode}` : '')
      const componentNameSegments = resolveComponentNameSegments(fileName.replace(QUOTE_RE, ''), prefixParts)
      const pascalName = pascalCase(componentNameSegments)

      if (LAZY_COMPONENT_NAME_REGEX.test(pascalName)) {
        console.warn(`[Compodium] The component \`${pascalName}\` (in \`${filePath}\`) is using the reserved "Lazy" prefix used for dynamic imports, which may cause it to break at runtime.`)
      }

      if (resolvedNames.has(pascalName + suffix) || resolvedNames.has(pascalName)) {
        warnAboutDuplicateComponent(pascalName, filePath, resolvedNames.get(pascalName) || resolvedNames.get(pascalName + suffix)!)
        continue
      }
      resolvedNames.set(pascalName + suffix, filePath)

      const kebabName = kebabCase(componentNameSegments)
      const shortPath = relative(srcDir, filePath)
      const chunkName = 'components/' + kebabName + suffix

      let component: Component = {
        // inheritable from directory configuration
        mode,
        global,
        island,
        prefetch: Boolean(dir.prefetch),
        preload: Boolean(dir.preload),
        // specific to the file
        filePath,
        pascalName,
        kebabName,
        chunkName,
        shortPath,
        export: 'default',
        // by default, give priority to scanned components
        priority: dir.priority ?? 1,
        // @ts-expect-error untyped property
        _scanned: true
      }

      if (typeof dir.extendComponent === 'function') {
        component = (await dir.extendComponent(component)) || component
      }

      // Ignore files like `~/components/index.vue` which end up not having a name at all
      if (!pascalName) {
        console.warn(`[Compodium] Component did not resolve to a file name in \`~/${relative(srcDir, filePath)}\`.`)
        continue
      }

      const existingComponent = components.find(c => c.pascalName === component.pascalName && ['all', component.mode].includes(c.mode))
      // Ignore component if component is already defined (with same mode)
      if (existingComponent) {
        const existingPriority = existingComponent.priority ?? 0
        const newPriority = component.priority ?? 0

        // Replace component if priority is higher
        if (newPriority > existingPriority) {
          components.splice(components.indexOf(existingComponent), 1, component)
        }
        // Warn if a user-defined (or prioritized) component conflicts with a previously scanned component
        if (newPriority > 0 && newPriority === existingPriority) {
          warnAboutDuplicateComponent(pascalName, filePath, existingComponent.filePath)
        }

        continue
      }

      components.push(component)
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

const LAZY_COMPONENT_NAME_REGEX = /^Lazy(?=[A-Z])/
