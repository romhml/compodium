import ts from 'typescript'
import { createCheckerBase, createCheckerByJsonConfigBase } from './base'
import type { MetaCheckerOptions } from 'vue-component-meta'

export type * from 'vue-component-meta'

export function createCheckerByJson(
  rootPath: string,
  json: any,
  checkerOptions: MetaCheckerOptions = {}
) {
  return createCheckerByJsonConfigBase(
    ts,
    rootPath,
    json,
    checkerOptions
  )
}

export function createChecker(
  tsconfig: string,
  checkerOptions: MetaCheckerOptions = {}
) {
  return createCheckerBase(
    ts,
    tsconfig,
    checkerOptions
  )
}
