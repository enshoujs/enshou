import type { ValidatorAdapter } from '@enshou/core'

import * as v from 'valibot'

export function valibotAdapter(): ValidatorAdapter {
  return {
    name: 'valibot',
    parse: (schema: v.GenericSchema, data: unknown) => v.parse(schema, data),
  }
}
