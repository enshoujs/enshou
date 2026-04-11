import { expect, it } from 'vitest'

import { Controller } from '../../src/routing/controller'
import { getControllerMetadata } from '../../src/routing/metadata'
import { Delete, Get, Patch, Post, Put } from '../../src/routing/methods'

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
  expect(meta.routes).toContainEqual(
    expect.objectContaining({ method: 'GET', path: '/users', handler: 'listUsers' }),
  )
})

it('should register POST route', () => {
  class TestController {
    @Post('/users')
    createUser() {}
  }

  const meta = getControllerMetadata(new TestController().constructor)
  expect(meta.routes).toContainEqual(
    expect.objectContaining({ method: 'POST', path: '/users', handler: 'createUser' }),
  )
})

it('should register PUT route', () => {
  class TestController {
    @Put('/:id')
    replaceUser() {}
  }

  const meta = getControllerMetadata(new TestController().constructor)
  expect(meta.routes).toContainEqual(
    expect.objectContaining({ method: 'PUT', path: '/:id', handler: 'replaceUser' }),
  )
})

it('should register PATCH route', () => {
  class TestController {
    @Patch('/:id')
    patchUser() {}
  }

  const meta = getControllerMetadata(new TestController().constructor)
  expect(meta.routes).toContainEqual(
    expect.objectContaining({ method: 'PATCH', path: '/:id', handler: 'patchUser' }),
  )
})

it('should register DELETE route', () => {
  class TestController {
    @Delete('/:id')
    deleteUser() {}
  }

  const meta = getControllerMetadata(new TestController().constructor)
  expect(meta.routes).toContainEqual(
    expect.objectContaining({ method: 'DELETE', path: '/:id', handler: 'deleteUser' }),
  )
})

it('should attach schema to route', () => {
  const schema = { json: { name: 'string' } }

  class TestController {
    @Post('/users', schema)
    createUser() {}
  }

  const meta = getControllerMetadata(new TestController().constructor)
  expect(meta.routes[0]?.schema).toBe(schema)
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
  expect(meta.routes).toHaveLength(3)
})

it('should normalize route path', () => {
  class TestController {
    @Get('users/')
    list() {}
  }

  const meta = getControllerMetadata(new TestController().constructor)
  expect(meta.routes[0]?.path).toBe('/users')
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

it('should initialize routes as empty array', () => {
  class TestController {}
  expect(getControllerMetadata(TestController).routes).toEqual([])
})
