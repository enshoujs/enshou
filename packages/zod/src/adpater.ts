import type { ValidatorAdapter, ValidatorParseResult } from '@enshou/core'
import type { ZodType } from 'zod'

export function zodAdapter(): ValidatorAdapter {
  return {
    name: 'zod',
    parse: (schema: ZodType, data: unknown): ValidatorParseResult => {
      const result = schema.safeParse(data)

      return {
        success: result.success,
        value: result.success ? result.data : undefined,
        issues: result.success
          ? []
          : result.error.issues.map((issue) => ({
              path: issue.path?.map(String),
              message: issue.message,
            })),
      }
    },
  }
}
