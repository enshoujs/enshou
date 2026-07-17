export class ComponentsRegistry {
  readonly schemas: Map<unknown, string> = new Map()
  readonly responses: Map<unknown, string> = new Map()

  defineSchema<T>(name: string, schema: T): T {
    this.schemas.set(schema, name)
    return schema
  }

  defineResponse<T>(name: string, schema: T): T {
    this.responses.set(schema, name)
    return schema
  }
}

export const defaultRegistry: ComponentsRegistry = new ComponentsRegistry()

export function defineSchema<Schema>(name: string, schema: Schema): Schema {
  return defaultRegistry.defineSchema(name, schema)
}

export function defineResponse<Schema>(name: string, schema: Schema): Schema {
  return defaultRegistry.defineResponse(name, schema)
}
