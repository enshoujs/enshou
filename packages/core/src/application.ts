import type { ClassProvider, Provider } from '@enshou/di'
import type { ErrorHandler as HonoErrorHandler, MiddlewareHandler } from 'hono'

import { Container } from '@enshou/di'
import { Hono } from 'hono'

import type { ErrorHandler } from './exceptions'
import type { MiddlewareDefinition } from './middleware'
import type { Class } from './utils'

import { asControllerMetadata } from './metadata'
import { normalizePath } from './utils'

export interface ApplicationOptions {
  basePath?: string
  controllers?: Class<any>[]
  providers?: Provider<unknown>[]
  middlewares?: MiddlewareDefinition[]
  errorHandler?: ClassProvider<ErrorHandler> | HonoErrorHandler
}

export class Application {
  public readonly container: Container = new Container()

  constructor(private readonly options: ApplicationOptions) {}

  get controllers(): Class<any>[] {
    return this.options.controllers ?? []
  }

  async instantiate(): Promise<Hono> {
    const app = new Hono()

    const {
      basePath = '',
      controllers = [],
      providers = [],
      middlewares = [],
      errorHandler,
    } = this.options

    for (const controller of controllers) {
      const metadata = asControllerMetadata(controller[Symbol.metadata])
      this.container.registerClass(metadata.token, controller)
    }

    for (const provider of providers) this.container.register(provider)

    const getMiddleware = async (definition: MiddlewareDefinition): Promise<MiddlewareHandler> => {
      if (typeof definition !== 'symbol') return definition as MiddlewareHandler
      const instance = await this.container.resolveAsync<any>(definition)
      return instance.handle.bind(instance)
    }

    const appMiddlewares = await Promise.all(middlewares.map(getMiddleware))

    for (const controller of controllers) {
      const metadata = asControllerMetadata(controller[Symbol.metadata])
      const instance = await this.container.resolveAsync<any>(metadata.token)

      const controllerMiddlewares = await Promise.all(metadata.middlewares.map(getMiddleware))

      for (const [handlerName, route] of metadata.routes.entries()) {
        const routeMiddlewares = await Promise.all(route.middlewares.map(getMiddleware))

        app.on(
          route.method,
          normalizePath(`${basePath}/${metadata.prefix}/${route.path}`) as any,
          ...appMiddlewares,
          ...controllerMiddlewares,
          ...routeMiddlewares,
          instance[handlerName].bind(instance),
        )
      }
    }

    if (!errorHandler) return app

    if ('provide' in errorHandler) {
      this.container.register(errorHandler)
      const instance = await this.container.resolveAsync<ErrorHandler>(errorHandler.provide)
      app.onError(instance.handle.bind(instance))
    } else app.onError(errorHandler)

    return app
  }
}
