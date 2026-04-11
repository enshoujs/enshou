import type { Container, ProviderToken } from '@enshou/di'
import type { Context, MiddlewareHandler, Next } from 'hono'

export interface InjectableMiddleware {
  use(c: Context, next: Next): Promise<Response | void>
}

export type MiddlewareDefinition = ProviderToken<InjectableMiddleware> | MiddlewareHandler

export function toHonoMiddleware(
  container: Container,
  definition: MiddlewareDefinition,
): MiddlewareHandler {
  const isInjectableClass =
    typeof definition === 'function' && definition.prototype && 'use' in definition.prototype
  const isExplicitToken =
    typeof definition === 'string' ||
    typeof definition === 'symbol' ||
    (typeof definition === 'object' && definition !== null) ||
    container.isRegistered(definition as any)

  if (!isInjectableClass && !isExplicitToken) return definition as MiddlewareHandler

  return async (c, next) => {
    const instance = container.resolve<any>(definition as any)
    if (instance && typeof instance.use === 'function') return instance.use(c, next)
    if (typeof instance === 'function') return (instance as MiddlewareHandler)(c, next)

    throw new Error(
      `Resolved middleware for token "${String(definition)}" is not a function or InjectableMiddleware`,
    )
  }
}
