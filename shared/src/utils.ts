import type { Class } from './types'

export function isClass(target: any): target is Class<any> {
  return (
    typeof target === 'function' &&
    !!target.prototype &&
    !Object.getOwnPropertyDescriptor(target, 'prototype')?.writable
  )
}

export function normalizePath(path: string): string {
  const normalized = path.trim().replace(/\/+/g, '/')
  if (normalized === '' || normalized === '/') return '/'
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash.slice(0, -1) : withLeadingSlash
}
