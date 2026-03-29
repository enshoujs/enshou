import type { Class } from '@enshou/shared'

import { Container } from '@enshou/di'
import { Hono } from 'hono'

import { PREFIX_KEY } from './decorators/controller'
import { ROUTE_KEY } from './decorators/methods'

export interface ApplicationOptions {
  controllers: Class<any>[]
  services: Class<any>[]
}

export class Application {
  container: Container = new Container()

  constructor(private options: ApplicationOptions) {}

  instantiate(): Hono {
    for (const Controller of this.options.controllers)
      this.container.registerClass(Controller, Controller)
    for (const Service of this.options.services)
      this.container.registerClass(Service, Service)

    const app = new Hono()

    for (const Controller of this.options.controllers) {
      const prefix = (Controller as any)[PREFIX_KEY]
      const routes = (Controller as any)[ROUTE_KEY] || []
      const instance = this.container.resolve<any>(Controller)

      for (const route of routes) {
        const path = `${prefix}${route.path}`.replace(/\/+/g, '/')
        app.on(route.method, path, instance[route.handler])
      }
    }

    return app
  }
}
