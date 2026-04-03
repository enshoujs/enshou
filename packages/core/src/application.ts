import type { Class } from '@enshou/shared'

import { Container } from '@enshou/di'
import { normalizePath } from '@enshou/shared'
import { Hono } from 'hono'

import type { RouteMetadata } from './decorators/methods'
import type { ValidatorAdapter } from './validation'

import { PREFIX_KEY } from './decorators/controller'
import { ROUTE_KEY } from './decorators/methods'
import { validate } from './validation'

export interface ApplicationOptions {
  controllers?: Class<any>[]
  services?: Class<any>[]
  validator?: ValidatorAdapter<any>
}

export class Application {
  container: Container = new Container()

  constructor(private options: ApplicationOptions) {}

  instantiate(): Hono {
    const controllers = this.options.controllers ?? []
    const services = this.options.services ?? []

    for (const c of controllers) this.container.registerClass(c, c)
    for (const s of services) this.container.registerClass(s, s)

    const app = new Hono()

    for (const controller of controllers) {
      const prefix = normalizePath((controller as any)[PREFIX_KEY] ?? '')

      const instance = this.container.resolve<any>(controller)
      const routes: RouteMetadata[] = (controller as any)[ROUTE_KEY] ?? []

      for (const route of routes) {
        const path = normalizePath(`${prefix}/${route.path}`)
        const handler = instance[route.handler].bind(instance)

        if (route.schema && this.options.validator) {
          app.on(route.method, path, validate(route.schema, this.options.validator), handler)
          continue
        }

        app.on(route.method, path, handler)
      }
    }

    return app
  }
}
