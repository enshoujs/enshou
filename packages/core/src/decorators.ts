import type { AnyFunction, HttpMethod } from '#/shared/types'

import type { Token } from './container'
import type { ControllerRoute } from './metadata'
import type { MiddlewareDefinition } from './middleware'

import { asControllerMetadata } from './metadata'

export function Inject<T>(token: Token<T>) {
  return function (_: unknown, context: ClassFieldDecoratorContext<unknown, T>): void {
    if (context.kind !== 'field') return
    context.metadata.injects ??= {}
    ;(context.metadata.injects as any)[context.name] = token
  }
}

export function Controller(prefix: string = '/') {
  return function (_target: any, context: ClassDecoratorContext): void {
    const metadata = asControllerMetadata(context.metadata)
    metadata.prefix = prefix
  }
}

type RouteMethodDecorator = (
  value: AnyFunction,
  context: ClassMethodDecoratorContext<object, AnyFunction>,
) => void

type RouteFieldDecorator = (
  value: undefined,
  context: ClassFieldDecoratorContext<object, AnyFunction>,
) => (initialValue: AnyFunction) => AnyFunction

type RouteDecorator = RouteMethodDecorator & RouteFieldDecorator
type RouteDecoratorFactory = (path: string) => RouteDecorator

function createMethodDecorator(method: HttpMethod): RouteDecoratorFactory {
  return function (path: string) {
    function decorator(
      _value: AnyFunction,
      context: ClassMethodDecoratorContext<object, AnyFunction>,
    ): void
    function decorator(
      _value: undefined,
      context: ClassFieldDecoratorContext<object, AnyFunction>,
    ): (initialValue: AnyFunction) => AnyFunction
    function decorator(
      _value: AnyFunction | undefined,
      context:
        | ClassMethodDecoratorContext<object, AnyFunction>
        | ClassFieldDecoratorContext<object, AnyFunction>,
    ): void | ((initialValue: AnyFunction) => AnyFunction) {
      const metadata = asControllerMetadata(context.metadata)

      const handlerName = String(context.name)
      const handlerMetadata = metadata.routes[handlerName]

      if (!handlerMetadata) metadata.routes[handlerName] = { method, middlewares: [], path }
      else if (handlerMetadata.middlewares?.length) {
        metadata.routes[handlerName] = { ...handlerMetadata, method, path }
      }

      if (context.kind === 'method') return

      return (initialValue: AnyFunction) => {
        return initialValue
      }
    }

    return decorator
  }
}

export const Get: RouteDecoratorFactory = createMethodDecorator('GET')
export const Query: RouteDecoratorFactory = createMethodDecorator('QUERY')
export const Post: RouteDecoratorFactory = createMethodDecorator('POST')
export const Put: RouteDecoratorFactory = createMethodDecorator('PUT')
export const Patch: RouteDecoratorFactory = createMethodDecorator('PATCH')
export const Delete: RouteDecoratorFactory = createMethodDecorator('DELETE')

export function Use(...middlewares: MiddlewareDefinition[]) {
  return function (
    _value: any,
    context: ClassDecoratorContext | ClassMethodDecoratorContext | ClassFieldDecoratorContext,
  ): void {
    const metadata = asControllerMetadata(context.metadata)

    if (context.kind === 'class') {
      metadata.middlewares.unshift(...middlewares)
      return
    }

    const handlerName = String(context.name)
    ;(metadata.routes[handlerName] as Partial<ControllerRoute>) ??= { middlewares: [] }
    metadata.routes[handlerName].middlewares.unshift(...middlewares)
  }
}
