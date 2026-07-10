import type { OnApplicationInit } from './lifecycle'

export interface Plugin extends OnApplicationInit {}

export type PluginDefinition = Plugin
