import type {
  AnyFunction,
  ClassFieldDecorator,
  ClassMethodDecorator,
  HttpMethod,
} from '#/shared/types'

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

export function Controller(prefix = '/') {
  return function (_target: any, context: ClassDecoratorContext): void {
    const metadata = asControllerMetadata(context.metadata)
    metadata.prefix = prefix
  }
}

type RouteDecorator = ClassMethodDecorator & ClassFieldDecorator
type RouteDecoratorFactory = (path: string) => RouteDecorator

function createMethodDecorator(method: HttpMethod): RouteDecoratorFactory {
  return function (path: string): RouteDecorator {
    function decorator(_target: AnyFunction, context: ClassMethodDecoratorContext): void
    function decorator(_target: undefined, context: ClassFieldDecoratorContext): void
    function decorator(
      _target: any,
      context: ClassMethodDecoratorContext | ClassFieldDecoratorContext,
    ): void {
      const metadata = asControllerMetadata(context.metadata)

      const handlerName = String(context.name)
      const handlerMetadata = metadata.routes[handlerName]

      if (!handlerMetadata) metadata.routes[handlerName] = { method, middlewares: [], path }
      else if (handlerMetadata.middlewares?.length) {
        metadata.routes[handlerName] = { ...handlerMetadata, method, path }
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
