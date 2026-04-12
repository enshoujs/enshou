import type { RouteDefinition } from '../../decorators/types'
import type { MiddlewareDefinition } from '../../middleware/types'

const CONTROLLER_METADATA_KEY: unique symbol = Symbol('controller-metadata')

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
