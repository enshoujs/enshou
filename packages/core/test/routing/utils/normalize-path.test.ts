import { expect, it } from 'vitest'

import { normalizePath } from '../../../src/internal/routing/path'

it('should return / for empty string', () => {
  expect(normalizePath('')).toBe('/')
})

it('should return / for single slash', () => {
  expect(normalizePath('/')).toBe('/')
})

it('should add leading slash when missing', () => {
  expect(normalizePath('users')).toBe('/users')
})

it('should strip trailing slash', () => {
  expect(normalizePath('/users/')).toBe('/users')
})

it('should collapse multiple slashes', () => {
  expect(normalizePath('//users//posts//')).toBe('/users/posts')
})

it('should trim whitespace', () => {
  expect(normalizePath('  /users  ')).toBe('/users')
})

it('should handle nested paths', () => {
  expect(normalizePath('/api/v1/users')).toBe('/api/v1/users')
})
