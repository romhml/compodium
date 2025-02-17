import { defineEventHandler } from 'h3'
import { useAppConfig } from '#imports'

export default defineEventHandler(() => {
  const appConfig = useAppConfig()
  return (appConfig.ui as any)?.colors
})
