import { z } from 'zod'

import type { OpenApiAdapter } from '../build-document'

import { parseResponseSchema } from './utils'

export const zodAdapter: OpenApiAdapter = {
  buildResponses(responsesMap: Map<unknown, string>) {
    const result: Record<string, unknown> = {}

    for (const [schema, name] of responsesMap.entries()) {
      const jsonSchema = z.toJSONSchema(schema as z.ZodType, {
        target: 'openapi-3.0',
      })
      result[name] = parseResponseSchema(jsonSchema)
    }

    return result
  },

  buildSchemas(schemasMap: Map<unknown, string>) {
    const registry = z.registry<{ id: string }>()

    for (const [schema, name] of schemasMap.entries()) {
      registry.add(schema as z.ZodType, { id: name })
    }

    return z.toJSONSchema(registry, {
      target: 'openapi-3.0',
      uri: (id) => {
        return `#/components/schemas/${id}`
      },
    })
  },

  getPropertySchema(schema: unknown, key: string) {
    const s = schema as any
    if (s?.shape && key in s.shape) {
      return s.shape[key]
    }
    return undefined
  },

  toJsonSchema(schema: unknown) {
    return z.toJSONSchema(schema as z.ZodType, {
      target: 'openapi-3.0',
    })
  },
}
