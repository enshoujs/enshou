import { it, expect, describe } from 'bun:test'
import { HTTPException as HonoHttpException } from 'hono/http-exception'

import { HttpException, ValidationException } from './exceptions'

describe('HttpException', () => {
  it('should be an instance of HonoHttpException', () => {
    const httpException = new HttpException(404)
    const validationException = new ValidationException([{ message: 'Invalid URL', path: ['url'] }])

    expect(httpException).toBeInstanceOf(HonoHttpException)
    expect(validationException).toBeInstanceOf(HonoHttpException)
  })

  it('should construct a response with the correct status, body, and headers', async () => {
    const body = { field: 'foo' }
    const headers = { 'x-header': 'bar' }

    const exception = new HttpException(404, { body, headers })

    const response = exception.getResponse()
    const responseBody = await response.json()

    expect(response.status).toEqual(404)
    expect(responseBody).toEqual(body)
    expect(response.headers.get('x-header')).toBe(headers['x-header'])
  })

  it('should construct a response with the correct status and headers, without body', () => {
    const headers = { 'x-header': 'bar' }

    const exception = new HttpException(404, { headers })

    const response = exception.getResponse()

    expect(response.status).toEqual(404)
    expect(response.body).toEqual(null)
    expect(response.headers.get('x-header')).toBe(headers['x-header'])
  })
})

describe('ValidationException', () => {
  it('should be an instance of HonoHttpException', () => {
    const validationException = new ValidationException([{ message: 'Invalid URL', path: ['url'] }])

    expect(validationException).toBeInstanceOf(HonoHttpException)
  })

  it('should be an instance of HttpException', () => {
    const validationException = new ValidationException([{ message: 'Invalid URL', path: ['url'] }])

    expect(validationException).toBeInstanceOf(HttpException)
  })

  it('should construct a response with the correct status, body, and headers', async () => {
    const issues = [{ message: 'Invalid URL', path: ['url'] }]
    const headers = { 'x-header': 'bar' }

    const validationException = new ValidationException(issues, { headers })

    const response = validationException.getResponse()
    const responseBody = await response.json()

    expect(response.status).toEqual(422)
    expect(responseBody).toEqual({
      issues,
      message: 'Validation failed.',
    })
    expect(response.headers.get('x-header')).toBe(headers['x-header'])
  })
})
