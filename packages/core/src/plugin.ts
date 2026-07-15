import type { Hono } from 'hono'

import type { ResolvedApplicationOptions } from './application'
import type { Container } from './container'

export interface PluginInitContext {
  container: Container
  hono: Hono
  options: ResolvedApplicationOptions
}

export interface Plugin {
  init(context: PluginInitContext): Promise<void> | void
}
