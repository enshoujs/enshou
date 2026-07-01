import type { Token } from '@enshou/di'
import type { Context, MiddlewareHandler, Next } from 'hono'

export interface Middleware {
  handle(c: Context, next: Next): Promise<Response | void>
}

export type MiddlewareDefinition = Token<Middleware> | MiddlewareHandler
