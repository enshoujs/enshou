import type { Plugin } from '@enshou/core'

import type { OpenApiInfo, OpenApiServer, SecurityScheme, SchemaResolver } from './types'
import type { ScalarOptions } from './ui'

import { buildDocument } from './builder'
import { scalarUi } from './ui'

export interface OpenApiPluginOptions {
  openapi?: {
    resolver: SchemaResolver
    info: OpenApiInfo
    path?: string
    servers?: OpenApiServer[]
    schemas?: Record<string, unknown>
    securitySchemes?: Record<string, SecurityScheme>
  }
  scalar?: ScalarOptions
}

export function OpenApiPlugin({ openapi, scalar }: OpenApiPluginOptions): Plugin {
  return {
    onApplicationInit: ({ hono, options: { controllers } }) => {
      if (!openapi || !controllers.length) return

      const document = buildDocument({ ...openapi, controllers })

      const openapiPath = openapi.path ?? '/openapi.json'
      hono.get(openapiPath, (c) => c.json(document))

      if (scalar?.path) hono.get(scalar.path, scalarUi({ ...scalar, path: openapiPath }))
    },
  }
}
