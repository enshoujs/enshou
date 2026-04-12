import type { ProviderToken } from '@enshou/di'
import type { Context, MiddlewareHandler, Next } from 'hono'

export interface InjectableMiddleware {
  use(c: Context, next: Next): Promise<Response | void>
}

export type MiddlewareDefinition = ProviderToken<InjectableMiddleware> | MiddlewareHandler
