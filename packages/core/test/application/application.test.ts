import type { Context } from 'hono'

import { Inject } from '@enshou/di'
import { expect, it, vi } from 'vitest'

import type { ValidatorAdapter } from '../../src/validation/adapter'

import { Application } from '../../src/application'
import { Controller } from '../../src/decorators/controller'
import { Delete, Get, Post, Put } from '../../src/decorators/routes'
import { ValidationError } from '../../src/validation/error'

const passthroughAdapter: ValidatorAdapter = {
  name: 'passthrough',
  parse: (_schema, value) => ({ success: true, value, issues: [] }),
}

function failAdapter(msg: string): ValidatorAdapter {
  return {
    name: 'fail',
    parse: (_schema, _value) => ({
      success: false,
      value: undefined,
      issues: [{ path: undefined, message: msg }],
    }),
  }
}

it('should return a Hono instance', () => {
  const app = new Application({}).instantiate()
  expect(typeof app.fetch).toBe('function')
})

it('should mount controller routes', async () => {
  @Controller('/hello')
  class HelloController {
    @Get('/')
    greet(c: Context) {
      return c.json({ message: 'hi' })
    }
  }

  const hono = new Application({ controllers: [HelloController] }).instantiate()
  const res = await hono.request('/hello')
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({ message: 'hi' })
})

it('should handle controller with no routes', async () => {
  @Controller('/empty')
  class EmptyController {}

  const hono = new Application({ controllers: [EmptyController] }).instantiate()
  const res = await hono.request('/empty')
  expect(res.status).toBe(404)
})

it('should combine controller prefix + route path', async () => {
  @Controller('/api/v1')
  class ApiController {
    @Get('/status')
    status(c: Context) {
      return c.json({ ok: true })
    }
  }

  const hono = new Application({ controllers: [ApiController] }).instantiate()
  const res = await hono.request('/api/v1/status')
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({ ok: true })
})

it('should support multiple HTTP methods on same controller', async () => {
  @Controller('/items')
  class ItemsController {
    @Get('/')
    list(c: Context) {
      return c.json([])
    }

    @Post('/')
    create(c: Context) {
      return c.json({ id: 1 }, 201)
    }

    @Put('/:id')
    replace(c: Context) {
      return c.json({ id: c.req.param('id') })
    }

    @Delete('/:id')
    remove(c: Context) {
      return c.body(null, 204)
    }
  }

  const hono = new Application({ controllers: [ItemsController] }).instantiate()

  expect((await hono.request('/items')).status).toBe(200)
  expect((await hono.request('/items', { method: 'POST' })).status).toBe(201)
  expect((await hono.request('/items/42', { method: 'PUT' })).status).toBe(200)
  expect((await hono.request('/items/42', { method: 'DELETE' })).status).toBe(204)
})

it('should mount multiple controllers', async () => {
  @Controller('/a')
  class AController {
    @Get('/')
    get(c: Context) {
      return c.json({ from: 'a' })
    }
  }

  @Controller('/b')
  class BController {
    @Get('/')
    get(c: Context) {
      return c.json({ from: 'b' })
    }
  }

  const hono = new Application({ controllers: [AController, BController] }).instantiate()
  expect(await (await hono.request('/a')).json()).toEqual({ from: 'a' })
  expect(await (await hono.request('/b')).json()).toEqual({ from: 'b' })
})

it('should use custom error handler', async () => {
  @Controller('/err')
  class ErrController {
    @Get('/')
    boom() {
      throw new Error('boom')
    }
  }

  const handler = vi.fn<(_err: Error, c: Context) => Response | Promise<Response>>((_err, c) =>
    c.json({ caught: true }, 500),
  )

  const hono = new Application({
    controllers: [ErrController],
    errorHandler: handler,
  }).instantiate()

  const res = await hono.request('/err')
  expect(res.status).toBe(500)
  expect(handler).toHaveBeenCalledOnce()
})

it('should run validation middleware when schema + adapter provided', async () => {
  const schema = { json: { __schemaMarker: true } }

  @Controller('/validated')
  class ValidatedController {
    @Post('/', schema)
    create(c: Context) {
      return c.json({ validated: true }, 201)
    }
  }

  const hono = new Application({
    controllers: [ValidatedController],
    validator: passthroughAdapter,
  }).instantiate()

  const res = await hono.request('/validated', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  })
  expect(res.status).toBe(201)
})

it('should throw ValidationError on failure', async () => {
  const schema = { json: {} }

  @Controller('/vfail')
  class VFailController {
    @Post('/', schema)
    create(c: Context) {
      return c.json({})
    }
  }

  let caught: unknown
  const hono = new Application({
    controllers: [VFailController],
    validator: failAdapter('bad input'),
    errorHandler: (err: Error, c: Context) => {
      caught = err
      return c.json({ error: err.message }, 422)
    },
  }).instantiate()

  const res = await hono.request('/vfail', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  })

  expect(res.status).toBe(422)
  expect(caught).toBeInstanceOf(ValidationError)
})

it('should skip validation when no adapter', async () => {
  const schema = { json: {} }

  @Controller('/novalidator')
  class NoValidatorController {
    @Post('/', schema)
    create(c: Context) {
      return c.json({ ok: true }, 200)
    }
  }

  const hono = new Application({
    controllers: [NoValidatorController],
  }).instantiate()

  const res = await hono.request('/novalidator', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  })
  expect(res.status).toBe(200)
})

it('should resolve provider classes and inject into controller', async () => {
  class Greeter {
    greet() {
      return 'hello from service'
    }
  }

  @Controller('/svc')
  @Inject(Greeter)
  class SvcController {
    constructor(private readonly greeter: Greeter) {}

    @Get('/')
    get(c: Context) {
      return c.json({ msg: this.greeter.greet() })
    }
  }

  const hono = new Application({
    controllers: [SvcController],
    providers: [Greeter],
  }).instantiate()

  const res = await hono.request('/svc')
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({ msg: 'hello from service' })
})
