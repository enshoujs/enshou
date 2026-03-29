export type Class<T> = new (...args: any[]) => T

export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD',
} as const
export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod]

export function normalizePath(path: string): string {
  if (path === '') return '/'
  return path.startsWith('/') ? path : `/${path}`
}
