const schemaNames = new WeakMap<object, string>()

export function defineSchema<T>(name: string, schema: T): T {
  if (typeof schema === 'object' && schema !== null) schemaNames.set(schema as object, name)
  return schema
}

export function getSchemaName(schema: unknown): string | undefined {
  if (typeof schema === 'object' && schema !== null) return schemaNames.get(schema as object)
  return undefined
}
