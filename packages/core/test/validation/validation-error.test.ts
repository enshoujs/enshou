import { expect, it } from 'vitest'

import { ValidationError } from '../../src/validation/validation-error'

it('should be an HTTPException with status 400', () => {
  const err = new ValidationError('json', [{ path: ['name'], message: 'Required' }])
  expect(err.status).toBe(400)
})

it('should store target', () => {
  const err = new ValidationError('query', [])
  expect(err.target).toBe('query')
})

it('should store issues', () => {
  const issues = [
    { path: ['age'], message: 'Must be a number' },
    { path: undefined, message: 'Invalid' },
  ]
  const err = new ValidationError('json', issues)
  expect(err.issues).toEqual(issues)
})

it('should have message "Validation Error"', () => {
  const err = new ValidationError('param', [])
  expect(err.message).toBe('Validation Error')
})
