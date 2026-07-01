import type { Token } from './token'

export type Class<T> = new (...args: any[]) => T

export function Inject(...tokens: Array<Token<any>>) {
  for (const token of tokens)
    if (typeof token !== 'symbol') throw new Error('DI token must be a Symbol')

  return function (_target: any, context: ClassDecoratorContext): void {
    context.metadata.injects = tokens
  }
}
