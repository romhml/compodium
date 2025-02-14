import { createCheckerByJson } from 'vue-component-meta'

export function createChecker(dirs?: any[]): ReturnType<typeof createCheckerByJson> {
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
