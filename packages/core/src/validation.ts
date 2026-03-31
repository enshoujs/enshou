import type { Context, MiddlewareHandler, Next } from 'hono'

export interface ValidatorAdapter<Schema = unknown> {
  name: string
  parse(schema: Schema, value: unknown): unknown
}

export function validate(
  schema: any,
  validator: ValidatorAdapter,
): MiddlewareHandler {
  return async (c: Context, next: Next): Promise<void> => {
    const query = c.req.query()
    const json =
      c.req.header('Content-Type') === 'application/json'
        ? await c.req.json()
        : undefined
    const param = c.req.param()

    const data = {
      json,
      query,
      param,
    } as const

    const result = validator.parse(schema, data) as any

    if (json) c.req.addValidatedData('json', result.json)
    if (query) c.req.addValidatedData('query', result.query)
    if (param) c.req.addValidatedData('param', result.param)

    return next()
  }
}
