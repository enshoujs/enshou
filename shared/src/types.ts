export type AnyFunction = (...args: any[]) => any
export type Class<T = unknown> = new (...args: any[]) => T
export type HttpMethod = 'GET' | 'QUERY' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'
