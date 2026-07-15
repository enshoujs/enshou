import type { HttpMethod } from '#/shared/types'

import type { MiddlewareDefinition } from './middleware'

export interface ControllerRoute {
  method: HttpMethod
  path: string
  middlewares: MiddlewareDefinition[]
}

export interface ControllerMetadata {
  prefix: string
  routes: Record<string, ControllerRoute>
  middlewares: MiddlewareDefinition[]
}

export function asControllerMetadata(metadata: any): ControllerMetadata {
  metadata.routes ??= {}
  metadata.middlewares ??= []
  return metadata as ControllerMetadata
}
