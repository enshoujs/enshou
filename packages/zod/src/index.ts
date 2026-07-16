import type { MiddlewareHandler } from 'hono'
import type { ValidationTargets } from 'hono/types'

import { ValidationException } from '@enshou/core'
import { validator as honoValidator } from 'hono/validator'
import { z } from 'zod'

export const TARGET_MAPPING: Record<string, keyof ValidationTargets> = {
  cookies: 'cookie',
  form: 'form',
  headers: 'header',
  json: 'json',
  params: 'param',
  query: 'query',
}

export type RouteSchema = z.ZodObject<{
  json?: z.ZodTypeAny
  form?: z.ZodTypeAny
  query?: z.ZodTypeAny
  params?: z.ZodTypeAny
  headers?: z.ZodTypeAny
  cookies?: z.ZodTypeAny
}>
export type ResponseSchema = z.ZodObject<{
  json?: z.ZodTypeAny
  headers?: z.ZodTypeAny
  cookies?: z.ZodTypeAny
}>

export function validate(routeSchema: RouteSchema): MiddlewareHandler[] {
  return Object.entries(routeSchema.shape).map(([target, schema]) => {
    return honoValidator(TARGET_MAPPING[target], async (data, _c) => {
      const result = await schema.safeParseAsync(data)

      if (result.success) return result.data

      const issues = result.error.issues.map((issue) => {
        return {
          message: issue.message,
          path: issue.path.map(String),
        }
      })

      throw new ValidationException(issues)
    })
  })
}
