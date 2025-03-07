import { defineEventHandler } from 'h3'
// import { useAppConfig } from '#imports'

export default defineEventHandler(() => {
  const appConfig: any = useAppConfig()
  return appConfig.compodium?.matchUIColors ? appConfig.ui?.colors : {}
})
