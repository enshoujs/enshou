import type { Class } from '#shared/types'

import { isClass } from '#shared/utils'

export type Token<Target = unknown> = symbol & { __for: Target }

export function token<Target = Class<any>>(target: Class<any> | string): Token<Target> {
  if (isClass(target)) return Symbol(target.name) as Token<Target>
  return Symbol(target) as Token<Target>
}
