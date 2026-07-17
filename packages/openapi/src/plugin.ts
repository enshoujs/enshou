import type { Module, Plugin, PluginInitContext } from '@enshou/core'

import type { OpenApiAdapter, OpenApiOptions } from './build-document'
import type { ComponentsRegistry } from './components'

import { buildDocument } from './build-document'
import { scalarUi } from './scalar'

export interface OpenApiPluginOptions {
  adapter: OpenApiAdapter
  modules: Module[]
  openapi: OpenApiOptions & {
    path: string
  }
  scalar?: {
    path: string
  }
  registry?: ComponentsRegistry
}

export function OpenApiPlugin({
  adapter,
  modules,
  openapi,
  scalar,
  registry,
}: OpenApiPluginOptions): Plugin {
  return {
    init({ hono }: PluginInitContext) {
      const document = buildDocument({ adapter, modules, openapi, registry })

      hono.get(openapi.path, (c) => {
        return c.json(document)
      })
      if (scalar) {
        hono.get(scalar.path, scalarUi({ ...scalar, url: openapi.path }))
      }
    },
  }
}
