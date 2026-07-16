type Schema = any
export const schemas: Map<Schema, string> = new Map()
export const responses: Map<Schema, string> = new Map()

export function defineSchema<Schema>(name: string, schema: Schema): Schema {
  schemas.set(schema, name)
  return schema
}

export function defineResponse<Schema>(name: string, schema: Schema): Schema {
  responses.set(schema, name)
  return schema
}
