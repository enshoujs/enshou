import { it, describe, expect } from 'bun:test'

import type { Token } from './container'

import { Inject, Controller, Get, Query, Post, Patch, Put, Delete, Use } from './decorators'

describe('Inject', () => {
  it('should inject metadata', () => {
    const TOKEN = Symbol() as Token<any>

    class Class {
      @Inject(TOKEN) field!: any
    }

    const metadata = Class[Symbol.metadata] as any

    expect(metadata.injects.field).toBe(TOKEN)
  })
})

describe('Controller', () => {
  it('should inject metadata', () => {
    @Controller()
    class Class {}

    const metadata = Class[Symbol.metadata] as any

    expect(metadata.prefix).toBe('/')
  })
})

describe('HTTP methods', () => {
  it('should inject metadata', () => {
    @Controller()
    class Class {
      @Get('/users')
      getUsers() {}

      @Query('/users/search')
      queryUsers() {}

      @Post('/users')
      postUsers() {}

      @Put('/users/:id')
      putUsers() {}

      @Patch('/users/:id')
      patchUsers() {}

      @Delete('/users/:id')
      deleteUsers() {}
    }

    const metadata = Class[Symbol.metadata] as any

    expect(metadata.routes).toMatchObject({
      deleteUsers: { method: 'DELETE', path: '/users/:id' },
      getUsers: { method: 'GET', path: '/users' },
      patchUsers: { method: 'PATCH', path: '/users/:id' },
      postUsers: { method: 'POST', path: '/users' },
      putUsers: { method: 'PUT', path: '/users/:id' },
      queryUsers: { method: 'QUERY', path: '/users/search' },
    })
  })
})

describe('Use', () => {
  it('should inject metadata', () => {
    const middleware1 = async () => {}
    const middleware2 = async () => {}
    const middleware3 = async () => {}

    @Controller()
    @Use(middleware1, middleware2)
    class Class {
      @Get('/users')
      @Use(middleware3)
      getUsers() {}
    }

    const metadata = Class[Symbol.metadata] as any

    expect(metadata.middlewares).toEqual([middleware1, middleware2])
    expect(metadata.routes.getUsers.middlewares).toEqual([middleware3])
  })
})
