import type { Class } from '@enshou/shared'

import type { Token } from './token'

export const INJECTS_KEY: unique symbol = Symbol()

export function Inject(tokens: Array<Token<any> | string | Class<any>>) {
  return function (target: any, _context?: ClassDecoratorContext): void {
    target[INJECTS_KEY] = tokens
  }
}
