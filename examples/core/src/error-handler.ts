import type { ErrorHandler as EnshouErrorHandler } from '@enshou/core'
import type { ErrorHandler as HonoErrorHandler } from 'hono'

import { RestException } from '@enshou/core'

export class ErrorHandler implements EnshouErrorHandler {
  handle: HonoErrorHandler = (err, c) => {
    if (err instanceof RestException) return err.toHTTP().getResponse()
    console.error(err)
    return c.json({ message: 'Unexpected server error' }, 500)
  }
}
