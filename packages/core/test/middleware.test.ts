import type { Context, Next } from 'hono'

import { createToken, Inject } from '@enshou/di'
import { describe, expect, it, vi } from 'vitest'

import type { Middleware } from '../src/middleware'

import { Application } from '../src/application'
import { Controller, Get, Use } from '../src/decorators'

describe('Middleware', () => {
  it('should apply injectable middleware', async () => {
    const TEST_MIDDLEWARE_TOKEN = createToken<TestMiddleware>('test-middleware')
    const middlewareSpy = vi.fn<() => void>()

    class TestMiddleware implements Middleware {
      async handle(c: Context, next: Next) {
        middlewareSpy()
        await next()
      }
    }

    @Controller()
    class TestController {
      @Use(TEST_MIDDLEWARE_TOKEN)
      @Get('/')
      index(c: Context) {
        return c.text('hello')
      }
    }

    const app = await new Application({
      controllers: [TestController],
      providers: [{ provide: TEST_MIDDLEWARE_TOKEN, useClass: TestMiddleware }],
    }).instantiate()

    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('hello')
    expect(middlewareSpy).toHaveBeenCalled()
  })

  it('should apply controller-wide middleware', async () => {
    const GLOBAL_MIDDLEWARE_TOKEN = createToken<GlobalMiddleware>('global-middleware')
    const middlewareSpy = vi.fn<() => void>()

    class GlobalMiddleware implements Middleware {
      async handle(c: Context, next: Next) {
        middlewareSpy()
        await next()
      }
    }

    @Use(GLOBAL_MIDDLEWARE_TOKEN)
    @Controller()
    class TestController {
      @Get('/')
      index(c: Context) {
        return c.text('hello')
      }
    }

    const app = await new Application({
      controllers: [TestController],
      providers: [{ provide: GLOBAL_MIDDLEWARE_TOKEN, useClass: GlobalMiddleware }],
    }).instantiate()

    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(middlewareSpy).toHaveBeenCalled()
  })

  it('should resolve dependencies in middleware', async () => {
    const SERVICE_TOKEN = createToken<Service>('service')
    const DI_MIDDLEWARE_TOKEN = createToken<DIMiddleware>('di-middleware')

    class Service {
      getName() {
        return 'di'
      }
    }

    @Inject(SERVICE_TOKEN)
    class DIMiddleware implements Middleware {
      constructor(private service: Service) {}

      async handle(c: Context, next: Next) {
        c.header('x-service', this.service.getName())
        await next()
      }
    }

    @Controller()
    class TestController {
      @Use(DI_MIDDLEWARE_TOKEN)
      @Get('/')
      index(c: Context) {
        return c.text('hello')
      }
    }

    const app = await new Application({
      controllers: [TestController],
      providers: [
        { provide: SERVICE_TOKEN, useClass: Service },
        { provide: DI_MIDDLEWARE_TOKEN, useClass: DIMiddleware },
      ],
    }).instantiate()

    const res = await app.request('/')
    expect(res.headers.get('x-service')).toBe('di')
  })

  it('should support multiple middlewares and maintain order', async () => {
    const order: string[] = []
    const M1_TOKEN = createToken<M1>('m1')
    const M2_TOKEN = createToken<M2>('m2')

    class M1 implements Middleware {
      async handle(_c: Context, next: Next) {
        order.push('m1')
        await next()
      }
    }

    class M2 implements Middleware {
      async handle(_c: Context, next: Next) {
        order.push('m2')
        await next()
      }
    }

    @Use(M1_TOKEN)
    @Controller()
    class TestController {
      @Use(M2_TOKEN)
      @Get('/')
      index(c: Context) {
        return c.text('hello')
      }
    }

    const app = await new Application({
      controllers: [TestController],
      providers: [
        { provide: M1_TOKEN, useClass: M1 },
        { provide: M2_TOKEN, useClass: M2 },
      ],
    }).instantiate()

    await app.request('/')
    expect(order).toEqual(['m1', 'm2'])
  })

  it('should support raw hono middleware', async () => {
    const rawMiddleware = async (c: Context, next: Next) => {
      c.header('x-raw', 'true')
      await next()
    }

    @Controller()
    class TestController {
      @Use(rawMiddleware)
      @Get('/')
      index(c: Context) {
        return c.text('hello')
      }
    }

    const app = await new Application({
      controllers: [TestController],
    }).instantiate()

    const res = await app.request('/')
    expect(res.headers.get('x-raw')).toBe('true')
  })

  describe('Tokens', () => {
    it('should throw when string token is used', async () => {
      const stringToken = 'my-middleware'

      @Controller()
      class TestController {
        @Use(stringToken as any)
        @Get('/')
        index(c: Context) {
          return c.text('hello')
        }
      }

      await expect(
        new Application({
          controllers: [TestController],
          providers: [
            {
              provide: stringToken as any,
              useValue: async (_c: Context, next: Next) => {
                await next()
              },
            },
          ],
        }).instantiate(),
      ).rejects.toThrow('DI token must be a Symbol')
    })

    it('should support symbol tokens', async () => {
      const MY_TOKEN = createToken<any>('my-token')
      const middlewareSpy = vi.fn<() => void>()

      @Controller()
      class TestController {
        @Use(MY_TOKEN)
        @Get('/')
        index(c: Context) {
          return c.text('hello')
        }
      }

      const app = await new Application({
        controllers: [TestController],
        providers: [
          {
            provide: MY_TOKEN,
            useValue: {
              handle: async (_c: Context, next: Next) => {
                middlewareSpy()
                await next()
              },
            },
          },
        ],
      }).instantiate()

      const res = await app.request('/')
      expect(res.status).toBe(200)
      expect(middlewareSpy).toHaveBeenCalled()
    })

    it('should throw when class token is used', async () => {
      class TokenClass {}

      @Controller()
      class TestController {
        @Use(TokenClass as any)
        @Get('/')
        index(c: Context) {
          return c.text('hello')
        }
      }

      await expect(
        new Application({
          controllers: [TestController],
          providers: [
            {
              provide: TokenClass as any,
              useValue: async (_c: Context, next: Next) => {
                await next()
              },
            },
          ],
        }).instantiate(),
      ).rejects.toThrow('DI token must be a Symbol')
    })

    it('should throw when resolved token is not a middleware', async () => {
      const MY_TOKEN = createToken<any>('invalid-middleware')

      @Controller()
      class TestController {
        @Use(MY_TOKEN)
        @Get('/')
        index(c: Context) {
          return c.text('hello')
        }
      }

      await expect(
        new Application({
          controllers: [TestController],
          providers: [{ provide: MY_TOKEN, useValue: 'not a function or object with .handle' }],
        }).instantiate(),
      ).rejects.toThrow()
    })
  })
})
