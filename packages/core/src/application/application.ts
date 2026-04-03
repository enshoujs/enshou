import type { Class } from '@enshou/shared'
import type { Context, Hono, Env as HonoEnv } from 'hono'
import type { HTTPResponseError } from 'hono/types'

import { Container } from '@enshou/di'

import type { ValidatorAdapter } from '../validation/types'

import { createApp } from './create-app'

export interface ApplicationOptions {
  controllers?: Class<any>[]
  services?: Class<any>[]
  validator?: ValidatorAdapter
  errorHandler?: <Env extends HonoEnv>(
    err: Error | HTTPResponseError,
    c: Context<Env>,
  ) => Response | Promise<Response>
}

export class Application {
  container: Container = new Container()

  constructor(private readonly options: ApplicationOptions) {}

  instantiate(): Hono {
    for (const controller of this.options.controllers ?? [])
      this.container.registerClass(controller, controller)
    for (const service of this.options.services ?? [])
      this.container.registerClass(service, service)

    return createApp(this.container, this.options)
  }
}
