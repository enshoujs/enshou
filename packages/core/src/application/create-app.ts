import type { Container } from '@enshou/di'

import { Hono } from 'hono'

import type { ApplicationOptions } from './application'

import { getControllerMetadata } from '../routing/metadata'
import { normalizePath } from '../routing/utils'
import { validate } from '../validation/middleware'

export function createApp(container: Container, options: ApplicationOptions): Hono {
  const app = new Hono()

  for (const controller of options.controllers ?? []) {
    const metadata = getControllerMetadata(controller)
    const prefix = normalizePath(metadata.prefix ?? '')
    const instance = container.resolve<any>(controller)

    for (const route of metadata.routes) {
      const path = normalizePath(`${prefix}/${route.path}`)
      const handler = instance[route.handler].bind(instance)

      if (route.schema && options.validator) {
        app.on(route.method, path, validate(route.schema, options.validator), handler)
        continue
      }

      app.on(route.method, path, handler)
    }
  }

  if (options.errorHandler) app.onError(options.errorHandler)

  return app
}
