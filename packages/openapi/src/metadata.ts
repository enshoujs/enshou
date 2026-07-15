import type { OperationMeta, TagMeta, SecurityRequirement } from './types'

export interface OpenApiControllerMetadata {
  openapi: {
    operations: Record<string, OperationMeta>
    tag?: TagMeta
    security?: SecurityRequirement[]
  }
}

export function asOpenApiMetadata(metadata: any): OpenApiControllerMetadata {
  metadata.openapi ??= {
    operations: {},
  }
  return metadata
}
