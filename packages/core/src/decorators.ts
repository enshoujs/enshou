import { createToken } from '@enshou/di'

import type { MiddlewareDefinition } from './middleware'
import type { AnyFunction } from './utils'

import { asControllerMetadata } from './metadata'
import { HttpMethod, normalizePath } from './utils'

export function Controller(prefix: string = '/') {
  return function (_target: any, context: ClassDecoratorContext): void {
    const metadata = asControllerMetadata(context.metadata)
    metadata.prefix = prefix
    metadata.token = createToken(context.name || 'AnonymousController')
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
      const handlerName = String(context.name)
      const metadata = asControllerMetadata(context.metadata)

      if (!metadata.routes.has(handlerName)) {
        metadata.routes.set(handlerName, {
          method,
          path: normalizePath(path),
          middlewares: [],
        })
      }

      if (context.kind === 'method') return

      return (initialValue: AnyFunction) => initialValue
    }

    return decorator
  }
}

export const Get: RouteDecoratorFactory = createMethodDecorator(HttpMethod.GET)
export const Post: RouteDecoratorFactory = createMethodDecorator(HttpMethod.POST)
export const Put: RouteDecoratorFactory = createMethodDecorator(HttpMethod.PUT)
export const Patch: RouteDecoratorFactory = createMethodDecorator(HttpMethod.PATCH)
export const Delete: RouteDecoratorFactory = createMethodDecorator(HttpMethod.DELETE)

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
    const route = metadata.routes?.get(handlerName)

    if (!route)
      throw Error(`@Use decorator on '${handlerName}' must be placed ABOVE the route decorator.`)

    route.middlewares.unshift(...middlewares)
  }
}
