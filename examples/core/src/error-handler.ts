import type { ErrorHandler as EnshouErrorHandler } from '@enshou/core'
import type { Context } from 'hono'

import { RestException } from '@enshou/core'
import { createToken } from '@enshou/di'

export const ERROR_HANDLER = createToken<ErrorHandler>('error-handler')

export class ErrorHandler implements EnshouErrorHandler {
  handle(err: any, c: Context): Response | Promise<Response> {
    if (err instanceof RestException) return err.toHTTP().getResponse()
    console.error(err)
    return c.json({ message: 'Unexpected server error' }, 500)
  }
}
