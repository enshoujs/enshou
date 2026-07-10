import type { AnyFunction } from '#shared/types'

import { asControllerMetadata } from '#shared/metadata'

type CronDecorator = {
  (_value: AnyFunction, context: ClassMethodDecoratorContext<object, AnyFunction>): void
  (
    _value: undefined,
    context: ClassFieldDecoratorContext<object, AnyFunction>,
  ): (initialValue: AnyFunction) => AnyFunction
}

export function Cron(pattern: string): CronDecorator {
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
    const controllerMetadata = asControllerMetadata(context.metadata)

    const handlerName = String(context.name)

    controllerMetadata.jobs.set(handlerName, pattern)

    if (context.kind === 'method') return

    return (initialValue: AnyFunction) => initialValue
  }

  return decorator
}
