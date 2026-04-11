import { expect, it } from 'vitest'

import { Inject, createToken } from '../src'
import { INJECTS_KEY } from '../src/inject'

it('should inject metadata on class', () => {
  const TOKEN = createToken('token')

  @Inject(TOKEN)
  class Class {}

  expect((Class as any)[INJECTS_KEY]).toEqual([TOKEN])
})

it('should support rest parameters', () => {
  const TOKEN1 = createToken('token')
  const TOKEN2 = createToken('token')

  @Inject(TOKEN1, TOKEN2)
  class Class {}

  expect((Class as any)[INJECTS_KEY]).toEqual([TOKEN1, TOKEN2])
})
