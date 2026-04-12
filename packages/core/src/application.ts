import type { Provider } from '@enshou/di'
import type { Context, Env as HonoEnv, Hono } from 'hono'
import type { HTTPResponseError } from 'hono/types'

import { Container } from '@enshou/di'

import type { Class } from './shared/types'
import type { ValidatorAdapter } from './validation/adapter'

import { buildApp } from './internal/app/build-app'

export type ApplicationProvider = Provider<unknown> | Class<any>

export interface ApplicationOptions {
  controllers?: Class<any>[]
  providers?: ApplicationProvider[]
  validator?: ValidatorAdapter
  errorHandler?: <Env extends HonoEnv>(
    err: Error | HTTPResponseError,
    c: Context<Env>,
  ) => Response | Promise<Response>
}

export class Application {
  private readonly container: Container = new Container()

  constructor(private readonly options: ApplicationOptions) {}

  instantiate(): Hono {
    for (const controller of this.options.controllers ?? [])
      this.container.registerClass(controller, controller)
    for (const provider of this.options.providers ?? [])
      this.container.register(
        typeof provider === 'function' ? { provide: provider, useClass: provider } : provider,
      )

    return buildApp(this.container, this.options)
  }
}
