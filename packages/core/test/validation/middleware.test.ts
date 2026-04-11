import { Hono } from 'hono'
import { expect, it, vi } from 'vitest'

import type { ValidatorAdapter } from '../../src/validation/types'

import { validate } from '../../src/validation/middleware'
import { ValidationError } from '../../src/validation/validation-error'

function makeAdapter(success: boolean, value?: unknown, issues = []): ValidatorAdapter {
  return {
    name: 'test',
    parse: vi
      .fn<ValidatorAdapter['parse']>()
      .mockReturnValue({ success, value: value ?? {}, issues }),
  }
}

it('should return one middleware per schema target', () => {
  const adapter = makeAdapter(true, {})
  const middlewares = validate({ json: {}, query: {} }, adapter)
  expect(middlewares).toHaveLength(2)
})

it('should pass parsed value through on success', async () => {
  const adapter = makeAdapter(true, { name: 'Alice' })
  const app = new Hono()

  const handlers = [
    ...validate({ json: {} }, adapter),
    (c: any) => {
      return c.json(c.req.valid('json' as any))
    },
  ]
  ;(app as any).post('/test', ...handlers)

  const res = await app.request('/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Alice' }),
  })

  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body).toEqual({ name: 'Alice' })
})

it('should throw ValidationError on failure', async () => {
  const issues = [{ path: ['name'], message: 'Required' }]
  const adapter = makeAdapter(false, undefined, issues as any)
  const app = new Hono()

  let caught: unknown
  const handlers = [...validate({ json: {} }, adapter), (c: any) => c.json({})]
  ;(app as any).post('/test', ...handlers)
  app.onError((err, c) => {
    caught = err
    return c.json({ error: err.message }, 400)
  })

  const res = await app.request('/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  })

  expect(res.status).toBe(400)
  expect(caught).toBeInstanceOf(ValidationError)
  expect((caught as ValidationError).target).toBe('json')
  expect((caught as ValidationError).issues).toEqual(issues)
})
