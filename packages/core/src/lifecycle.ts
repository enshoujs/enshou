import type { Container } from '@enshou/di'
import type { Hono } from 'hono'

import type { Application, ApplicationOptions } from './application'

export interface OnApplicationInit {
  onApplicationInit({
    hono,
    options,
    container,
    application,
  }: {
    hono: Hono
    options: ApplicationOptions
    container: Container
    application: Application
  }): Promise<void> | void
}
