import { expectTypeOf, it } from 'vitest'

import { createToken } from '../src'

it('should be symbol', () => {
  expectTypeOf(createToken('token')).toBeSymbol()
})
