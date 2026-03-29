import { expect, it } from 'vitest'
import { createToken, Inject } from '../src'
import { INJECTS_KEY } from '../src/metadata'

it('should save inject metadata on class', () => {
  const TOKEN = createToken('token')

  @Inject([TOKEN])
  class Class {}

  expect((Class as any)[INJECTS_KEY]).toEqual([TOKEN])
})

it('should preserve dependency order', () => {
  const TOKEN1 = createToken('token')
  const TOKEN2 = createToken('token')

  @Inject([TOKEN1, TOKEN2])
  class Class {}

  expect((Class as any)[INJECTS_KEY]).toEqual([TOKEN1, TOKEN2])
})

it('should save empty dependencies', () => {
  @Inject([])
  class Class {}

  expect((Class as any)[INJECTS_KEY]).toEqual([])
})

it('should not overwrite metadata on another class', () => {
  const TOKEN1 = createToken('token')
  const TOKEN2 = createToken('token')

  @Inject([TOKEN1])
  class Class1 {}

  @Inject([TOKEN2])
  class Class2 {}

  expect((Class1 as any)[INJECTS_KEY]).toEqual([TOKEN1])
  expect((Class2 as any)[INJECTS_KEY]).toEqual([TOKEN2])
})
