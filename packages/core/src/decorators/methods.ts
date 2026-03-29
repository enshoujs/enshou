import { HttpMethod, normalizePath } from '@enshou/shared'

export const ROUTE_KEY: unique symbol = Symbol()

export interface RouteDefinition {
  method: HttpMethod
  path: string
  handler: string
}

type RouteHandler = (...args: any[]) => any
type RouteMethodDecorator = (
  value: RouteHandler,
  context: ClassMethodDecoratorContext<object, RouteHandler>,
) => void
type RouteFieldDecorator = (
  value: undefined,
  context: ClassFieldDecoratorContext<object, RouteHandler>,
) => (initialValue: RouteHandler) => RouteHandler
type RouteDecorator = RouteMethodDecorator & RouteFieldDecorator

type RouteDecoratorFactory = (path?: string) => RouteDecorator

function createMethodDecorator(method: HttpMethod): RouteDecoratorFactory {
  return function (path: string = '/') {
    function decorator(
      _value: RouteHandler,
      context: ClassMethodDecoratorContext<object, RouteHandler>,
    ): void
    function decorator(
      _value: undefined,
      context: ClassFieldDecoratorContext<object, RouteHandler>,
    ): (initialValue: RouteHandler) => RouteHandler
    function decorator(
      _value: RouteHandler | undefined,
      context:
        | ClassMethodDecoratorContext<object, RouteHandler>
        | ClassFieldDecoratorContext<object, RouteHandler>,
    ): void | ((initialValue: RouteHandler) => RouteHandler) {
      context.addInitializer(function () {
        ;((this as any).constructor[ROUTE_KEY] ??= []).push({
          method,
          path: normalizePath(path),
          handler: String(context.name),
        })
      })

      if (context.kind === 'method') return

      return (initialValue: RouteHandler) => initialValue
    }

    return decorator
  }
}

export const Get: RouteDecoratorFactory = createMethodDecorator(HttpMethod.GET)
export const Post: RouteDecoratorFactory = createMethodDecorator(
  HttpMethod.POST,
)
export const Put: RouteDecoratorFactory = createMethodDecorator(HttpMethod.PUT)
export const Patch: RouteDecoratorFactory = createMethodDecorator(
  HttpMethod.PATCH,
)
export const Delete: RouteDecoratorFactory = createMethodDecorator(
  HttpMethod.DELETE,
)
