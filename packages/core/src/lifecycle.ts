import type { Hono } from 'hono'

import type { ResolvedApplicationOptions } from './application'

export interface ApplicationInitContext {
  hono: Hono
  options: ResolvedApplicationOptions
}

export interface OnApplicationInit {
  onApplicationInit(ctx: ApplicationInitContext): Promise<void> | void
}
