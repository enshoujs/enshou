import type { StatusCode } from 'hono/utils/http-status'

export type AnySchema = object

export interface InlineResponse {
  description?: string
  schema?: AnySchema
}

export interface ResponseRef {
  $ref: AnySchema
  description?: string
}

export type ResponseDefinition = InlineResponse | ResponseRef

export interface OperationMeta {
  tags?: string[]
  summary?: string
  schema?: AnySchema
  responses?: Partial<Record<StatusCode, ResponseDefinition>>
}

export type HandlerName = string

export interface OpenApiMetadata {
  openapi: {
    tags: string[]
    operations: Record<HandlerName, OperationMeta>
  }
}

export function asOpenApiMetadata(metadata: any): OpenApiMetadata {
  metadata.openapi ??= {}
  metadata.openapi.tags ??= []
  metadata.openapi.operations ??= {}
  return metadata
}
