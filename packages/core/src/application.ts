import type { Provider } from '@enshou/di'
import type { MiddlewareHandler } from 'hono'

import { Container, createToken } from '@enshou/di'
import { Hono } from 'hono'

import type { Class } from '#shared/types'

import { asControllerMetadata } from '#shared/metadata'
import { isClass, normalizePath } from '#shared/utils'

import type { EnshouErrorHandler, ErrorHandlerDefinition, HonoErrorHandler } from './exceptions'
import type { Middleware, MiddlewareDefinition } from './middleware'
import type { PluginDefinition } from './plugin'

export interface ApplicationOptions {
  container?: Container
  basePath?: string
  controllers?: Class<any>[]
  providers?: Provider<any>[]
  middlewares?: MiddlewareDefinition[]
  plugins?: PluginDefinition[]
  errorHandler?: ErrorHandlerDefinition
}

export class Application {
  readonly container: Container
  readonly basePath: string
  readonly controllers: Class<any>[]
  readonly providers: Provider<unknown>[]
  readonly middlewares: MiddlewareDefinition[]
  readonly plugins: PluginDefinition[]
  readonly errorHandler?: Class<EnshouErrorHandler> | HonoErrorHandler

  constructor(options: ApplicationOptions) {
    this.container = options.container ?? new Container()
    this.basePath = options.basePath ?? ''
    this.controllers = options.controllers ?? []
    this.providers = options.providers ?? []
    this.middlewares = options.middlewares ?? []
    this.plugins = options.plugins ?? []
    this.errorHandler = options.errorHandler
  }

  private async _resolveMiddlewares(
    middlewares: MiddlewareDefinition[],
  ): Promise<MiddlewareHandler[]> {
    return await Promise.all(
      middlewares.map(async (middleware) => {
        if (typeof middleware !== 'symbol') return middleware
        const instance = await this.container.resolveAsync<Middleware>(middleware)
        return instance.handle.bind(instance)
      }),
    )
  }

  async instantiate(): Promise<Hono> {
    const application = new Hono()

    for (const provider of this.providers) this.container.register(provider)

    const appMiddlewares = await this._resolveMiddlewares(this.middlewares)

    for (const controller of this.controllers) {
      const metadata = asControllerMetadata(controller[Symbol.metadata])
      this.container.registerClass(metadata.token, controller)
      const instance = await this.container.resolveAsync<any>(metadata.token)

      const controllerMiddlewares = await this._resolveMiddlewares(metadata.middlewares)

      for (const [handlerName, route] of metadata.routes.entries()) {
        const routeMiddlewares = await this._resolveMiddlewares(route.middlewares)

        application.on(
          route.method,
          normalizePath(`${this.basePath}/${metadata.prefix}/${route.path}`) as any,
          ...appMiddlewares,
          ...controllerMiddlewares,
          ...routeMiddlewares,
          instance[handlerName].bind(instance),
        )
      }
    }

    if (isClass(this.errorHandler)) {
      const token = createToken<EnshouErrorHandler>(this.errorHandler.name)
      this.container.registerClass(token, this.errorHandler)
      const errorHandler = await this.container.resolveAsync(token)
      application.onError(errorHandler.handle.bind(errorHandler))
    } else if (typeof this.errorHandler === 'function') application.onError(this.errorHandler)

    return application
  }
}
