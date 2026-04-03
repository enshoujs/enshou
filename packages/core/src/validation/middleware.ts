import type { Context, MiddlewareHandler, Next, ValidationTargets } from 'hono'

import { HTTPException } from 'hono/http-exception'

import type { RouteSchema } from '../routing'
import type { ValidatorAdapter } from './types'

import { ValidationError } from './validation-error'

export function validate(schema: RouteSchema, validator: ValidatorAdapter): MiddlewareHandler {
  return async (c: Context, next: Next): Promise<void> => {
    for (const [key, value] of Object.entries(schema)) {
      let data = {}

      if (key === 'json' && c.req.header('Content-Type') === 'application/json') {
        try {
          data = await c.req.json()
        } catch {
          throw new HTTPException(400, { message: 'Malformed JSON' })
        }
      }
      if (key === 'query') data = c.req.query()
      if (key === 'param') data = c.req.param()

      const result = validator.parse(value, data)

      if (!result.success) throw new ValidationError(key as keyof ValidationTargets, result.issues)

      c.req.addValidatedData(key as any, result.value as any)
    }

    return next()
  }
}
