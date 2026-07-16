import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'

import { Application } from './application'

describe('instantiate', () => {
  it('should return Hono instance', async () => {
    const application = new Application({ modules: [] })

    const hono = await application.instantiate()

    expect(hono).toBeInstanceOf(Hono)
  })
})
