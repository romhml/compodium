import { createCheckerByJson } from 'vue-component-meta'
// @ts-expect-error virtual file
import dirs from '#compodium/nitro/dirs'

let checker

export function createChecker(): ReturnType<typeof createCheckerByJson> {
  const rootDir = process.cwd()

  return createCheckerByJson(
    rootDir,
    {
      extends: `${rootDir}/tsconfig.json`,
      skipLibCheck: true,
      include: [
        '**/*',
        ...dirs?.map((dir: any) => {
          const path = typeof dir === 'string' ? dir : (dir?.path || '')
          if (path.endsWith('.vue')) {
            return path
          }
          return `${path}/**/*`
        }) ?? []
      ],
      exclude: []
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
}

export function getChecker(): ReturnType<typeof createCheckerByJson> {
  return checker ??= createChecker()
}
