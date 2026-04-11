import type { Container } from '@enshou/di'

import { Hono } from 'hono'

import type { ApplicationOptions } from './application'

import { getControllerMetadata } from '../routing/metadata'
import { toHonoMiddleware } from '../routing/middleware'
import { normalizePath } from '../utils'
import { validate } from '../validation/middleware'

export function createApp(container: Container, options: ApplicationOptions): Hono {
  const app = new Hono()

  for (const controller of options.controllers ?? []) {
    const metadata = getControllerMetadata(controller)
    const prefix = normalizePath(metadata.prefix)
    const instance = container.resolve<any>(controller)

    const controllerMiddlewares = metadata.middlewares.map((m) => toHonoMiddleware(container, m))

    for (const [handlerName, route] of metadata.routes.entries()) {
      const path = normalizePath(`${prefix}/${route.path}`)
      const handler = instance[handlerName].bind(instance)

      const routeMiddlewares = route.middlewares.map((m) => toHonoMiddleware(container, m))

      const allMiddlewares = [...controllerMiddlewares, ...routeMiddlewares]

      if (route.schema && options.validator) {
        app.on(
          route.method as any,
          path as any,
          ...allMiddlewares,
          ...validate(route.schema, options.validator),
          handler,
        )
        continue
      }

      app.on(route.method as any, path as any, ...allMiddlewares, handler)
    }
  }

  if (options.errorHandler) app.onError(options.errorHandler)

  return app
}
