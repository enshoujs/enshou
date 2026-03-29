import { INJECTS_KEY, type InjectableClass } from './metadata'
import type { Token } from './token'

type Class<T> = new (...args: any[]) => T

export function Inject(tokens: Array<Token<any>>) {
  return function <T extends Class<any>>(target: T, _context?: ClassDecoratorContext<T>): void {
    ;(target as InjectableClass<any>)[INJECTS_KEY] = tokens
  }
}
