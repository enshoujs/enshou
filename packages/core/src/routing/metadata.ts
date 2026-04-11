import type { ValidationTargets } from 'hono'

import type { HttpMethod } from '../utils'
import type { MiddlewareDefinition } from './middleware'

const CONTROLLER_METADATA_KEY: unique symbol = Symbol('controller-metadata')

export type RouteSchema = Partial<Record<keyof ValidationTargets, any>>
export interface RouteDefinition {
  method: HttpMethod
  path: string
  schema?: RouteSchema
  middlewares: MiddlewareDefinition[]
}

export interface ControllerMetadata {
  prefix: string
  routes: Map<string, RouteDefinition>
  middlewares: MiddlewareDefinition[]
}

export function getControllerMetadata(target: object | DecoratorMetadata): ControllerMetadata {
  const metadataTarget = target as any
  return (metadataTarget[CONTROLLER_METADATA_KEY] ??= {
    prefix: '',
    routes: new Map(),
    middlewares: [],
  })
}
