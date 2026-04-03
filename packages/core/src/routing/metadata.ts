import type { HttpMethod } from '@enshou/shared'
import type { ValidationTargets } from 'hono'

const CONTROLLER_METADATA_KEY: unique symbol = Symbol()

export type RouteSchema = Partial<Record<keyof ValidationTargets, any>>
export interface RouteDefinition {
  method: HttpMethod
  path: string
  handler: string
  schema?: RouteSchema
}
export interface ControllerMetadata {
  prefix?: string
  routes: RouteDefinition[]
}

type MetadataTarget = object & {
  [CONTROLLER_METADATA_KEY]?: ControllerMetadata
}

export function getControllerMetadata(target: object): ControllerMetadata {
  return ((target as MetadataTarget)[CONTROLLER_METADATA_KEY] ??= {
    routes: [],
  })
}
