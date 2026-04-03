import type { RouteSchema } from '@enshou/core'

import * as v from 'valibot'

export type InferSchema<Schema extends RouteSchema> = {
  [K in keyof Schema]: Schema[K] extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>
    ? v.InferOutput<Schema[K]>
    : never
}
