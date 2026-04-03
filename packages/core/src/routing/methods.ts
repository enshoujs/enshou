import type { AnyFunction } from '@enshou/shared'

import { HttpMethod, normalizePath } from '@enshou/shared'

import type { RouteSchema } from './metadata'

import { getControllerMetadata } from './metadata'

type RouteMethodDecorator = (
  value: AnyFunction,
  context: ClassMethodDecoratorContext<object, AnyFunction>,
) => void
type RouteFieldDecorator = (
  value: undefined,
  context: ClassFieldDecoratorContext<object, AnyFunction>,
) => (initialValue: AnyFunction) => AnyFunction
type RouteDecorator = RouteMethodDecorator & RouteFieldDecorator
type RouteDecoratorFactory = (path: string, schema?: RouteSchema) => RouteDecorator

function createMethodDecorator(method: HttpMethod): RouteDecoratorFactory {
  return function (path: string, schema?: RouteSchema) {
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
      context.addInitializer(function () {
        getControllerMetadata(this.constructor).routes.push({
          method,
          path: normalizePath(path),
          handler: String(context.name),
          schema,
        })
      })

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
