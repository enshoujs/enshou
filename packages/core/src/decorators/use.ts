import type { MiddlewareDefinition } from '../middleware'

import { getControllerMetadata } from '../internal/routing/metadata'

export function Use(...middlewares: MiddlewareDefinition[]) {
  return function (
    _value: any,
    context: ClassDecoratorContext | ClassMethodDecoratorContext | ClassFieldDecoratorContext,
  ): void {
    if (context.kind === 'class') {
      context.addInitializer(function () {
        const metadata = getControllerMetadata(this)
        metadata.middlewares.push(...middlewares)
      })
      return
    }

    context.addInitializer(function () {
      const constructor = (this as any).constructor
      const metadata = getControllerMetadata(constructor)
      const handlerName = String(context.name)
      const route = metadata.routes.get(handlerName)

      if (!route)
        throw Error(`@Use decorator on '${handlerName}' must be placed ABOVE the route decorator.`)

      route.middlewares.push(...middlewares)
    })
  }
}
