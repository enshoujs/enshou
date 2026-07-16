import type { Module } from '@enshou/core'

import { asControllerMetadata } from '@enshou/core'

import { normalizePath } from '#/shared/utils'

import type { OperationMeta } from './metadata'

import { parseResponseSchema } from './adapters/utils'
import { asOpenApiMetadata } from './metadata'
import { schemas, responses } from './schema'

export interface OpenApiAdapter {
  buildSchemas(schemasMap: Map<unknown, string>): Record<string, unknown>
  buildResponses(responsesMap: Map<unknown, string>): Record<string, unknown>
  toJsonSchema(schema: unknown): unknown
  getPropertySchema(schema: unknown, key: string): unknown
}

export interface OpenApiOptions {
  info: {
    title: string
    version: string
  }
}

export interface BuildDocumentOptions {
  adapter: OpenApiAdapter
  openapi: OpenApiOptions
  modules: Module[]
}

export interface OpenApiDocument {
  openapi: '3.1.0'
  info: {
    title: string
    version: string
  }
  paths: Record<string, any>
  components: {
    schemas: Record<string, any>
    responses: Record<string, any>
  }
}

interface OpenApiParameter {
  in: 'query' | 'path' | 'header' | 'cookie'
  name: string
  required: boolean
  schema: unknown
}

interface OpenApiOperation {
  tags?: string[]
  summary?: string
  parameters?: OpenApiParameter[]
  requestBody?: { content: Record<string, { schema: unknown }> }
  responses: Record<string, unknown>
}

const PARAM_LOCATIONS = [
  { in: 'query', key: 'query' },
  { in: 'path', key: 'params' },
  { in: 'header', key: 'headers' },
  { in: 'cookie', key: 'cookies' },
] as const

function buildParameters(jsonSchema: any): OpenApiParameter[] {
  const properties = jsonSchema.properties ?? {}

  return PARAM_LOCATIONS.flatMap(({ key, in: location }) => {
    const schema = properties[key]
    if (!schema?.properties) return []

    return Object.entries(schema.properties).map(([propertyName, propertySchema]) => {
      return {
        in: location,
        name: propertyName,
        required: schema.required?.includes(propertyName) ?? false,
        schema: propertySchema,
      }
    })
  })
}

function buildRequestBody(
  adapter: OpenApiAdapter,
  operationSchema: any,
  jsonSchema: any,
): OpenApiOperation['requestBody'] | undefined {
  const jsonBodySchema = adapter.getPropertySchema(operationSchema, 'json')
  const formBodySchema = adapter.getPropertySchema(operationSchema, 'form')
  const bodySchema = jsonBodySchema ?? formBodySchema

  const schemaName = schemas.get(bodySchema)
  if (bodySchema && schemaName) {
    const contentType = jsonBodySchema ? 'application/json' : 'application/x-www-form-urlencoded'
    return {
      content: {
        [contentType]: {
          schema: { $ref: `#/components/schemas/${schemaName}` },
        },
      },
    }
  }

  const properties = jsonSchema.properties ?? {}
  if (!properties.json && !properties.form) return undefined

  const content: Record<string, { schema: unknown }> = {}
  if (properties.json) content['application/json'] = { schema: properties.json }
  if (properties.form) content['application/x-www-form-urlencoded'] = { schema: properties.form }

  return { content }
}

function buildResponses(adapter: OpenApiAdapter, responsesRecord: Record<string, any>) {
  const result: Record<string, unknown> = {}

  for (const [status, response] of Object.entries(responsesRecord)) {
    if (response.$ref) {
      const schemaName = responses.get(response.$ref)
      if (!schemaName) continue

      result[status] = {
        $ref: `#/components/responses/${schemaName}`,
        description: response.description,
      }
      continue
    }

    const { schema, ...rest } = response

    if (schema) {
      const jsonSchema = adapter.toJsonSchema(schema)
      const parsedResponse = parseResponseSchema(jsonSchema)

      result[status] = {
        ...rest,
        ...parsedResponse,
      }
    } else result[status] = rest
  }

  return result
}

function buildOperation(
  adapter: OpenApiAdapter,
  controllerTags: string[],
  operationMetadata: OperationMeta,
): OpenApiOperation {
  const tags = operationMetadata?.tags
    ? [...controllerTags, ...operationMetadata.tags]
    : controllerTags

  const operation: OpenApiOperation = {
    responses: {},
    summary: operationMetadata.summary,
    tags,
  }

  if (operationMetadata?.schema) {
    const jsonSchema: any = adapter.toJsonSchema(operationMetadata.schema)

    operation.parameters = buildParameters(jsonSchema)
    operation.requestBody = buildRequestBody(adapter, operationMetadata.schema, jsonSchema)
  }

  if (operationMetadata?.responses) {
    operation.responses = buildResponses(adapter, operationMetadata.responses)
  }

  return operation
}

export function buildDocument({
  adapter,
  openapi,
  modules,
}: BuildDocumentOptions): OpenApiDocument {
  const paths: Record<string, Record<string, OpenApiOperation>> = {}

  for (const module of modules) {
    for (const Controller of module.controllers) {
      const controllerMetadata = asControllerMetadata(Controller[Symbol.metadata])
      const controllerOpenApiMetadata = asOpenApiMetadata(controllerMetadata).openapi

      for (const [handlerName, route] of Object.entries(controllerMetadata.routes)) {
        const fullPath = normalizePath(`${controllerMetadata.prefix}/${route.path}`)
        const openApiPath = fullPath.replaceAll(/:([a-zA-Z0-9_]+)/g, '{$1}')

        const operationMetadata = controllerOpenApiMetadata.operations?.[handlerName]
        const operation = buildOperation(adapter, controllerOpenApiMetadata.tags, operationMetadata)

        paths[openApiPath] ??= {}
        paths[openApiPath][route.method.toLowerCase()] = operation
      }
    }
  }

  return {
    components: {
      responses: adapter.buildResponses(responses),
      schemas: adapter.buildSchemas(schemas),
    },
    info: openapi.info,
    openapi: '3.1.0',
    paths,
  }
}
