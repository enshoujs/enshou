import type { RouteSchema } from '@enshou/core/decorators'

import * as v from 'valibot'

export type InferSchema<Schema extends RouteSchema> = {
  [K in keyof Schema]: Schema[K] extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>
    ? v.InferOutput<Schema[K]>
    : never
}
