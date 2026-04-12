import { createToken, Inject } from '@enshou/di'
import { Context, Next } from 'hono'
import { describe, expect, it, vi } from 'vitest'

import type { InjectableMiddleware } from '../src/middleware'

import { Application } from '../src/application'
import { Controller } from '../src/decorators/controller'
import { Get } from '../src/decorators/routes'
import { Use } from '../src/decorators/use'

describe('Middleware', () => {
  it('should apply injectable middleware', async () => {
    const middlewareSpy = vi.fn<() => void>()

    class TestMiddleware implements InjectableMiddleware {
      async use(c: Context, next: Next) {
        middlewareSpy()
        await next()
      }
    }

    @Controller()
    class TestController {
      @Use(TestMiddleware)
      @Get('/')
      index(c: Context) {
        return c.text('hello')
      }
    }

    const app = new Application({
      controllers: [TestController],
      providers: [TestMiddleware],
    }).instantiate()

    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('hello')
    expect(middlewareSpy).toHaveBeenCalled()
  })

  it('should apply controller-wide middleware', async () => {
    const middlewareSpy = vi.fn<() => void>()

    class GlobalMiddleware implements InjectableMiddleware {
      async use(c: Context, next: Next) {
        middlewareSpy()
        await next()
      }
    }

    @Use(GlobalMiddleware)
    @Controller()
    class TestController {
      @Get('/')
      index(c: Context) {
        return c.text('hello')
      }
    }

    const app = new Application({
      controllers: [TestController],
      providers: [GlobalMiddleware],
    }).instantiate()

    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(middlewareSpy).toHaveBeenCalled()
  })

  it('should resolve dependencies in middleware', async () => {
    class Service {
      getName() {
        return 'di'
      }
    }

    @Inject(Service)
    class DIMiddleware implements InjectableMiddleware {
      constructor(private service: Service) {}

      async use(c: Context, next: Next) {
        c.header('x-service', this.service.getName())
        await next()
      }
    }

    @Controller()
    class TestController {
      @Use(DIMiddleware)
      @Get('/')
      index(c: Context) {
        return c.text('hello')
      }
    }

    const app = new Application({
      controllers: [TestController],
      providers: [Service, DIMiddleware],
    }).instantiate()

    const res = await app.request('/')
    expect(res.headers.get('x-service')).toBe('di')
  })

  it('should support multiple middlewares and maintain order', async () => {
    const order: string[] = []

    class M1 implements InjectableMiddleware {
      async use(_c: Context, next: Next) {
        order.push('m1')
        await next()
      }
    }

    class M2 implements InjectableMiddleware {
      async use(_c: Context, next: Next) {
        order.push('m2')
        await next()
      }
    }

    @Use(M1)
    @Controller()
    class TestController {
      @Use(M2)
      @Get('/')
      index(c: Context) {
        return c.text('hello')
      }
    }

    const app = new Application({
      controllers: [TestController],
      providers: [M1, M2],
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

    const app = new Application({
      controllers: [TestController],
    }).instantiate()

    const res = await app.request('/')
    expect(res.headers.get('x-raw')).toBe('true')
  })

  describe('Tokens', () => {
    it('should support string tokens', async () => {
      const stringToken = 'my-middleware'
      const middlewareSpy = vi.fn<() => void>()

      @Controller()
      class TestController {
        @Use(stringToken)
        @Get('/')
        index(c: Context) {
          return c.text('hello')
        }
      }

      const app = new Application({
        controllers: [TestController],
        providers: [
          {
            provide: stringToken,
            useValue: async (_c: Context, next: Next) => {
              middlewareSpy()
              await next()
            },
          },
        ],
      }).instantiate()

      const res = await app.request('/')
      expect(res.status).toBe(200)
      expect(middlewareSpy).toHaveBeenCalled()
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

      const app = new Application({
        controllers: [TestController],
        providers: [
          {
            provide: MY_TOKEN,
            useValue: async (_c: Context, next: Next) => {
              middlewareSpy()
              await next()
            },
          },
        ],
      }).instantiate()

      const res = await app.request('/')
      expect(res.status).toBe(200)
      expect(middlewareSpy).toHaveBeenCalled()
    })

    it('should support class-based tokens without .use', async () => {
      class TokenClass {}
      const middlewareSpy = vi.fn<() => void>()

      @Controller()
      class TestController {
        @Use(TokenClass as any)
        @Get('/')
        index(c: Context) {
          return c.text('hello')
        }
      }

      const app = new Application({
        controllers: [TestController],
        providers: [
          {
            provide: TokenClass,
            useValue: async (_c: Context, next: Next) => {
              middlewareSpy()
              await next()
            },
          },
        ],
      }).instantiate()

      const res = await app.request('/')
      expect(res.status).toBe(200)
      expect(middlewareSpy).toHaveBeenCalled()
    })

    it('should throw when resolved token is not a middleware', async () => {
      const stringToken = 'invalid-middleware'

      @Controller()
      class TestController {
        @Use(stringToken)
        @Get('/')
        index(c: Context) {
          return c.text('hello')
        }
      }

      const app = new Application({
        controllers: [TestController],
        providers: [
          {
            provide: stringToken,
            useValue: 'not a function or object with .use',
          },
        ],
      }).instantiate()

      const res = await app.request('/')
      expect(res.status).toBe(500)
    })
  })
})
