import type { MiddlewareHandler, ValidationTargets } from 'hono'

import { ValidationException } from '@enshou/core'
import { validator as honoValidator } from 'hono/validator'
import { safeParseAsync } from 'valibot'
import * as v from 'valibot'

export const TARGET_MAPPING: Record<string, keyof ValidationTargets> = {
  cookies: 'cookie',
  form: 'form',
  headers: 'header',
  json: 'json',
  params: 'param',
  query: 'query',
}

type ValibotSchema = v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>

export type RouteSchema = v.ObjectSchema<
  {
    json?: ValibotSchema
    form?: ValibotSchema
    query?: ValibotSchema
    params?: ValibotSchema
    headers?: ValibotSchema
    cookies?: ValibotSchema
  },
  any
>
export type ResponseSchema = v.ObjectSchema<
  {
    json?: ValibotSchema
    headers?: ValibotSchema
    cookies?: ValibotSchema
  },
  any
>

export function validate(routeSchema: RouteSchema): MiddlewareHandler[] {
  return Object.entries(routeSchema.entries).map(([target, schema]) => {
    return honoValidator(TARGET_MAPPING[target], async (data, _c) => {
      const result = await safeParseAsync(schema, data)

      if (result.success) return result.output

      const issues = result.issues.map((issue) => {
        return {
          message: issue.message,
          path: issue.path!.map((p) => {
            return String(p.key)
          }),
        }
      })

      throw new ValidationException(issues)
    })
  })
}
