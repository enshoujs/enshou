import type { Provider } from '@enshou/di'
import type { Context, Hono, Env as HonoEnv } from 'hono'
import type { HTTPResponseError } from 'hono/types'

import { Container } from '@enshou/di'

import type { Class } from '../types'
import type { ValidatorAdapter } from '../validation/types'

import { createApp } from './create-app'

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

    return createApp(this.container, this.options)
  }
}
