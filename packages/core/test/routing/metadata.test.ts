import { Context, Next } from 'hono'
import { describe, expect, it } from 'vitest'

import { Application } from '../../src/application'
import { Controller } from '../../src/routing/controller'
import { getControllerMetadata } from '../../src/routing/metadata'
import { Delete, Get, Patch, Post, Put } from '../../src/routing/methods'
import { Use } from '../../src/routing/use'

describe('Controller Metadata', () => {
  it('should set prefix on class metadata', () => {
    @Controller('/api')
    class TestController {}

    expect(getControllerMetadata(TestController).prefix).toBe('/api')
  })

  it('should default prefix to /', () => {
    @Controller()
    class TestController {}

    expect(getControllerMetadata(TestController).prefix).toBe('/')
  })

  it('should register GET route', () => {
    class TestController {
      @Get('/users')
      listUsers() {}
    }

    const meta = getControllerMetadata(new TestController().constructor)
    expect(meta.routes.get('listUsers')).toMatchObject({
      method: 'GET',
      path: '/users',
    })
  })

  it('should register POST route', () => {
    class TestController {
      @Post('/users')
      createUser() {}
    }

    const meta = getControllerMetadata(new TestController().constructor)
    expect(meta.routes.get('createUser')).toMatchObject({
      method: 'POST',
      path: '/users',
    })
  })

  it('should register PUT route', () => {
    class TestController {
      @Put('/:id')
      replaceUser() {}
    }

    const meta = getControllerMetadata(new TestController().constructor)
    expect(meta.routes.get('replaceUser')).toMatchObject({
      method: 'PUT',
      path: '/:id',
    })
  })

  it('should register PATCH route', () => {
    class TestController {
      @Patch('/:id')
      patchUser() {}
    }

    const meta = getControllerMetadata(new TestController().constructor)
    expect(meta.routes.get('patchUser')).toMatchObject({
      method: 'PATCH',
      path: '/:id',
    })
  })

  it('should register DELETE route', () => {
    class TestController {
      @Delete('/:id')
      deleteUser() {}
    }

    const meta = getControllerMetadata(new TestController().constructor)
    expect(meta.routes.get('deleteUser')).toMatchObject({
      method: 'DELETE',
      path: '/:id',
    })
  })

  it('should attach schema to route', () => {
    const schema = { json: { name: 'string' } }

    class TestController {
      @Post('/users', schema)
      createUser() {}
    }

    const meta = getControllerMetadata(new TestController().constructor)
    expect(meta.routes.get('createUser')?.schema).toBe(schema)
  })

  it('should support multiple routes on one controller', () => {
    class TestController {
      @Get('/users')
      list() {}

      @Post('/users')
      create() {}

      @Delete('/:id')
      remove() {}
    }

    const meta = getControllerMetadata(new TestController().constructor)
    expect(meta.routes.size).toBe(3)
  })

  it('should normalize route path', () => {
    class TestController {
      @Get('users/')
      list() {}
    }

    const meta = getControllerMetadata(new TestController().constructor)
    expect(meta.routes.get('list')?.path).toBe('/users')
  })

  it('should return same object on repeated calls (identity)', () => {
    class TestController {}
    const a = getControllerMetadata(TestController)
    const b = getControllerMetadata(TestController)
    expect(a).toBe(b)
  })

  it('should return different objects for different classes', () => {
    class A {}
    class B {}
    expect(getControllerMetadata(A)).not.toBe(getControllerMetadata(B))
  })

  it('should initialize routes as empty Map', () => {
    class TestController {}
    expect(getControllerMetadata(TestController).routes).toEqual(new Map())
  })
})

describe('Metadata Fixes', () => {
  it('should not duplicate routes when multiple instances are created', () => {
    @Controller()
    class TestController {
      @Get('/')
      index() {}
    }

    // Creating multiple instances
    new TestController()
    new TestController()
    new TestController()

    const meta = getControllerMetadata(TestController)
    expect(meta.routes.size).toBe(1)
  })

  it('should register middlewares when @Use is placed ABOVE the route decorator', () => {
    const middleware = async (c: Context, next: Next) => await next()

    @Controller()
    class TestController {
      @Use(middleware)
      @Get('/')
      index() {}
    }

    new TestController()

    const meta = getControllerMetadata(TestController)
    expect(meta.routes.get('index')?.middlewares.length).toBe(1)
  })

  it('should throw when @Use is placed BELOW the route decorator', () => {
    const middleware = async (c: Context, next: Next) => await next()

    expect(() => {
      @Controller()
      class TestController {
        @Get('/')
        @Use(middleware)
        index() {}
      }

      new TestController()
    }).toThrow(/must be placed ABOVE the route decorator/)
  })

  it('should respect decorator order (Multiple @Use)', async () => {
    const middleware1 = async (c: Context, next: Next) => {
      c.header('x-order-1', 'true')
      await next()
    }
    const middleware2 = async (c: Context, next: Next) => {
      c.header('x-order-2', 'true')
      await next()
    }

    @Controller()
    class TestController {
      @Use(middleware1)
      @Use(middleware2)
      @Get('/')
      index(c: Context) {
        return c.text('hello')
      }
    }

    const app = new Application({
      controllers: [TestController],
    }).instantiate()

    const res = await app.request('/')
    expect(res.headers.get('x-order-1')).toBe('true')
    expect(res.headers.get('x-order-2')).toBe('true')
  })
})
