import { INJECTS_KEY, type InjectableClass } from './metadata'
import type { Token } from './token'

type Class<T> = new (...args: any[]) => T

export type Scope = 'singleton' | 'transient'

interface ClassProvider<T> {
  kind: 'class'
  useClass: Class<T>
  scope: Scope
}

export class Container {
  private readonly providers: Map<Token<unknown>, ClassProvider<any>> = new Map()
  private readonly singletonCache: Map<Token<unknown>, unknown> = new Map()

  registerValue(token: Token<unknown>, value: unknown): void {
    this.singletonCache.set(token, value)
  }

  registerClass(token: Token<unknown>, value: Class<any>, scope: Scope = 'singleton'): void {
    this.providers.set(token, {
      kind: 'class',
      useClass: value,
      scope,
    })
  }

  resolve<T>(token: Token<T>): T {
    if (this.singletonCache.has(token)) return this.singletonCache.get(token) as T

    const provider = this.providers.get(token)
    if (!provider) throw Error(`No provider for ${String(token)}`)

    const deps = ((provider.useClass as InjectableClass<any>)[INJECTS_KEY] ?? []).map(
      this.resolve.bind(this),
    )
    const value = new provider.useClass(...deps)

    if (provider.scope === 'singleton') this.singletonCache.set(token, value)

    return value as T
  }
}
