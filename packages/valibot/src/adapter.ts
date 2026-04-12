import type { ValidatorAdapter, ValidatorParseResult } from '@enshou/core/validation'
import type { GenericSchema } from 'valibot'

import { safeParse } from 'valibot'

export function valibotAdapter(): ValidatorAdapter {
  return {
    name: 'valibot',
    parse: (schema: GenericSchema, data: unknown): ValidatorParseResult => {
      const result = safeParse(schema, data)

      return {
        success: result.success,
        value: result.success ? result.output : undefined,
        issues: result.success
          ? []
          : result.issues.map((issue) => ({
              path: issue.path?.map((p) => String(p.key)),
              message: issue.message,
            })),
      }
    },
  }
}
