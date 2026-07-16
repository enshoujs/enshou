import type { ErrorHandler } from 'hono/types'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { HTTPException as HonoHttpException } from 'hono/http-exception'

import type { Class } from '#/shared/types'

export type HonoErrorHandler = ErrorHandler

export interface EnshouErrorHandler {
  handle: HonoErrorHandler
}

export type ErrorHandlerDefinition = Class<EnshouErrorHandler> | HonoErrorHandler

interface RestExceptionOptions {
  body?: unknown
  headers?: HeadersInit
  message?: string
  cause?: unknown
}

export class HttpException extends HonoHttpException {
  constructor(status: ContentfulStatusCode, options: RestExceptionOptions = {}) {
    let res: Response | undefined = undefined

    if (options.body) res = Response.json(options.body, { headers: options.headers, status })
    if (!options.body && options.headers) {
      res = new Response(null, { headers: options.headers, status })
    }

    super(status, {
      cause: options.cause,
      message: options.message,
      res,
    })
  }
}

interface ValidationExceptionOptions {
  headers?: HeadersInit
  cause?: unknown
}

export class ValidationException extends HttpException {
  constructor(
    issues: { path: string[]; message: string }[],
    options: ValidationExceptionOptions = {},
  ) {
    super(422, {
      body: { issues, message: 'Validation failed.' },
      cause: options.cause,
      headers: options.headers,
      message: 'Validation failed.',
    })
  }
}
