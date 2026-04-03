import type { Class } from '@enshou/shared'

import type { Token } from './token'

import { INJECTS_KEY } from './inject'

export type Scope = 'singleton' | 'transient'

interface ClassProvider<T> {
  kind: 'class'
  useClass: Class<T>
  scope: Scope
}

export class Container {
  private readonly providers: Map<Token<unknown> | string | Class<any>, ClassProvider<any>> =
    new Map()
  private readonly singletonCache: Map<Token<unknown> | string | Class<any>, unknown> = new Map()

  registerValue(token: Token<unknown> | string, value: unknown): void {
    this.singletonCache.set(token, value)
  }

  registerClass(
    token: Token<unknown> | string | Class<any>,
    value: Class<any>,
    scope: Scope = 'singleton',
  ): void {
    this.providers.set(token, {
      kind: 'class',
      useClass: value,
      scope,
    })
  }

  resolve<T>(token: Token<T> | string | Class<any>): T {
    if (this.singletonCache.has(token)) return this.singletonCache.get(token) as T

    const provider = this.providers.get(token)
    if (!provider) throw Error(`No provider for ${String(token)}`)

    const deps = ((provider.useClass as any)[INJECTS_KEY] ?? []).map(this.resolve.bind(this))
    const value = new provider.useClass(...deps)

    if (provider.scope === 'singleton') this.singletonCache.set(token, value)

    return value as T
  }
}
