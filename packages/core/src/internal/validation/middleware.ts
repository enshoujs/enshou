import type { MiddlewareHandler, ValidationTargets } from 'hono'

import { validator as honoValidator } from 'hono/validator'

import type { RouteSchema } from '../../decorators/types'
import type { ValidatorAdapter } from '../../validation/adapter'

import { ValidationError } from '../../validation/error'

export function validate(schema: RouteSchema, validator: ValidatorAdapter): MiddlewareHandler[] {
  return Object.entries(schema).map(([key, value]) => {
    return honoValidator(key as keyof ValidationTargets, (data, _c) => {
      const result = validator.parse(value, data)

      if (!result.success) throw new ValidationError(key as keyof ValidationTargets, result.issues)

      return result.value as any
    })
  })
}
