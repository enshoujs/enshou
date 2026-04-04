import type { Class } from '@enshou/shared'

import type { Token } from './token'

import { INJECTS_KEY } from './inject'

export type Scope = 'singleton' | 'transient'

export type ProviderToken<T> = Token<T> | string | Class<T>

export interface ClassProvider<T> {
  provide: ProviderToken<T>
  useClass: Class<T>
  scope?: Scope
}

export interface ValueProvider<T> {
  provide: ProviderToken<T>
  useValue: T
}

export interface FactoryProvider<T> {
  provide: ProviderToken<T>
  useFactory: (container: Container) => T
  scope?: Scope
}

export type Provider<T> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T>

interface RegisteredClassProvider<T> {
  kind: 'class'
  useClass: Class<T>
  scope: Scope
}

interface RegisteredFactoryProvider<T> {
  kind: 'factory'
  useFactory: (container: Container) => T
  scope: Scope
}

type RegisteredProvider<T> = RegisteredClassProvider<T> | RegisteredFactoryProvider<T>

export class Container {
  private readonly providers: Map<ProviderToken<unknown>, RegisteredProvider<any>> = new Map()
  private readonly singletonCache: Map<ProviderToken<unknown>, unknown> = new Map()

  register<T>(provider: Provider<T>): void {
    this.singletonCache.delete(provider.provide)

    if ('useValue' in provider) {
      this.singletonCache.set(provider.provide, provider.useValue)
      return
    }

    if ('useFactory' in provider) {
      this.providers.set(provider.provide, {
        kind: 'factory',
        useFactory: provider.useFactory,
        scope: provider.scope ?? 'singleton',
      })
      return
    }

    this.providers.set(provider.provide, {
      kind: 'class',
      useClass: provider.useClass,
      scope: provider.scope ?? 'singleton',
    })
  }

  registerValue(token: ProviderToken<unknown>, value: unknown): void {
    this.register({
      provide: token,
      useValue: value,
    })
  }

  registerClass(
    token: ProviderToken<unknown>,
    value: Class<any>,
    scope: Scope = 'singleton',
  ): void {
    this.register({
      provide: token,
      useClass: value,
      scope,
    })
  }

  resolve<T>(token: ProviderToken<T>): T {
    if (this.singletonCache.has(token)) return this.singletonCache.get(token) as T

    const provider = this.providers.get(token)
    if (!provider) throw Error(`No provider for ${String(token)}`)

    let value: unknown

    if (provider.kind === 'factory') {
      value = provider.useFactory(this)
    } else {
      const deps = ((provider.useClass as any)[INJECTS_KEY] ?? []).map(this.resolve.bind(this))
      value = new provider.useClass(...deps)
    }

    if (provider.scope === 'singleton') this.singletonCache.set(token, value)

    return value as T
  }
}
