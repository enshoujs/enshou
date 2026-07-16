import type { GenericSchema } from 'valibot'

import { toJsonSchema, toJsonSchemaDefs } from '@valibot/to-json-schema'

import type { OpenApiAdapter } from '../build-document'

import { schemas } from '../schema'
import { parseResponseSchema } from './utils'

export const valibotAdapter: OpenApiAdapter = {
  buildResponses(responsesMap: Map<unknown, string>) {
    const responses: Record<string, unknown> = {}

    const definitions: Record<string, GenericSchema> = {}
    for (const [schema, name] of schemas.entries()) {
      definitions[name] = schema as GenericSchema
    }

    for (const [schema, name] of responsesMap.entries()) {
      const jsonSchema = toJsonSchema(schema as GenericSchema, {
        definitions,
        overrideRef: (context) => {
          return `#/components/schemas/${context.referenceId}`
        },
        target: 'openapi-3.0',
      })
      responses[name] = parseResponseSchema(jsonSchema)
    }

    return responses
  },

  buildSchemas(schemasMap: Map<unknown, string>) {
    const definitions: Record<string, GenericSchema> = {}

    for (const [schema, name] of schemasMap.entries()) {
      definitions[name] = schema as GenericSchema
    }

    return toJsonSchemaDefs(definitions, {
      overrideRef: (context) => {
        return `#/components/schemas/${context.referenceId}`
      },
      target: 'openapi-3.0',
    })
  },

  getPropertySchema(schema: unknown, key: string) {
    const s = schema as any
    if (s?.entries && key in s.entries) {
      return s.entries[key]
    }
    return undefined
  },

  toJsonSchema(schema: unknown) {
    return toJsonSchema(schema as GenericSchema, {
      overrideRef: (context) => {
        return `#/components/schemas/${context.referenceId}`
      },
      target: 'openapi-3.0',
    })
  },
}
