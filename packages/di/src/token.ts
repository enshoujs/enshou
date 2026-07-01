export type Token<T = unknown> = symbol & { __type: T }

export function createToken<T>(description: string): Token<T> {
  return Symbol(description) as Token<T>
}
