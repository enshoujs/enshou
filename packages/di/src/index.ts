if (!Symbol.metadata) (Symbol as any).metadata = Symbol.for('Symbol.metadata')

export { Container } from './container'
export type {
  ClassProvider,
  FactoryProvider,
  Provider,
  ResolutionContext,
  ResolutionFrame,
  Scope,
  ValueProvider,
  UseFactory,
} from './container'
export { Inject } from './inject'
export { createToken } from './token'
export type { Token } from './token'
export type { OnModuleInit } from './lifecycle'
