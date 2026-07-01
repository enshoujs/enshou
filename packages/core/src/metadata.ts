import type { Token } from '@enshou/di'

import type { MiddlewareDefinition } from './middleware'
import type { HttpMethod } from './utils'

export interface RouteDefinition {
  method: HttpMethod
  path: string
  middlewares: MiddlewareDefinition[]
}

export interface ControllerMetadata {
  prefix: string
  routes: Map<string, RouteDefinition>
  middlewares: MiddlewareDefinition[]
  token: Token<any>
}

export function asControllerMetadata(metadata: any): ControllerMetadata {
  metadata.routes ??= new Map()
  metadata.middlewares ??= []
  return metadata
}
