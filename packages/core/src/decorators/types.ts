import type { ValidationTargets } from 'hono'

import type { MiddlewareDefinition } from '../middleware'
import type { HttpMethod } from '../shared/http-method'

export type RouteSchema = Partial<Record<keyof ValidationTargets, any>>

export interface RouteDefinition {
  method: HttpMethod
  path: string
  schema?: RouteSchema
  middlewares: MiddlewareDefinition[]
}
