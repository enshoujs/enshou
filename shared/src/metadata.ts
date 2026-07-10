export interface ControllerMetadata {
  prefix?: string
  routes: Map<string, any>
  middlewares: any[]
  token?: any

  jobs: Map<string, string>

  openapi: {
    operations: Map<string, any>
    tag?: any
    security?: any[]
  }
}

export function asControllerMetadata(metadata: any): ControllerMetadata {
  metadata.routes ??= new Map()
  metadata.middlewares ??= []
  metadata.jobs ??= new Map()
  metadata.openapi ??= {
    operations: new Map(),
  }

  return metadata
}
