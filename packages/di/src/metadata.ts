import type { Token } from './token'

type Class<T> = new (...args: any[]) => T

export type InjectableClass<T> = Class<T> & {
  [INJECTS_KEY]?: Array<Token<any>>
}

export const INJECTS_KEY: unique symbol = Symbol('injects')
