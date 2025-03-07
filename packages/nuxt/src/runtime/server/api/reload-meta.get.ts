import { defineEventHandler } from 'h3'
import { getChecker } from '../services/checker'

export default defineEventHandler(async () => {
  const checker = getChecker()
  checker.reload()
})
