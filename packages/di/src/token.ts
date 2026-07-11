import type { Class } from '#shared/types'

import { isClass } from '#shared/utils'

export type Token<Target = unknown> = symbol & { __for: Target }

export function token<Target>(name: string): Token<Target>
export function token<Target>(target: Class<Target>): Token<Target>
export function token(target: any): any {
  if (isClass(target)) return Symbol(target.name)
  return Symbol(target)
}
