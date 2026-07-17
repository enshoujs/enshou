import type { StatusCode } from 'hono/utils/http-status'

import type { ClassDecorator, ClassFieldDecorator, ClassMethodDecorator } from '#/shared/types'

import type { OperationMeta, ResponseDefinition } from './metadata'

import { asOpenApiMetadata, ensureOperation } from './metadata'

export type ApiTagDecorator = ClassDecorator & ClassMethodDecorator & ClassFieldDecorator

export function ApiTag(...tags: string[]): ApiTagDecorator {
  function decorator(target: any, context: ClassDecoratorContext): void
  function decorator(target: any, context: ClassMethodDecoratorContext): void
  function decorator(target: any, context: ClassFieldDecoratorContext): void
  function decorator(
    _target: any,
    context: ClassDecoratorContext | ClassMethodDecoratorContext | ClassFieldDecoratorContext,
  ) {
    const metadata = asOpenApiMetadata(context.metadata)

    if (context.kind === 'field' || context.kind === 'method') {
      const operation = ensureOperation(metadata, String(context.name))
      operation.tags = tags
      return
    }

    metadata.openapi.tags = tags
  }

  return decorator
}

export type ApiOperationDecorator = ClassMethodDecorator & ClassFieldDecorator

export type ApiOperationOptions = Omit<OperationMeta, 'tags' | 'responses'>

export function ApiOperation(operation: ApiOperationOptions): ApiOperationDecorator {
  function decorator(target: any, context: ClassMethodDecoratorContext): void
  function decorator(target: any, context: ClassFieldDecoratorContext): void
  function decorator(
    _target: any,
    context: ClassMethodDecoratorContext | ClassFieldDecoratorContext,
  ) {
    const metadata = asOpenApiMetadata(context.metadata)
    const name = String(context.name)

    const operationMeta = ensureOperation(metadata, name)
    Object.assign(operationMeta, operation)
  }

  return decorator
}

export type ApiResponseDecorator = ClassMethodDecorator & ClassFieldDecorator

export function ApiResponse(
  status: StatusCode,
  response: ResponseDefinition,
): ApiResponseDecorator {
  function decorator(target: any, context: ClassMethodDecoratorContext): void
  function decorator(target: any, context: ClassFieldDecoratorContext): void
  function decorator(
    _target: any,
    context: ClassMethodDecoratorContext | ClassFieldDecoratorContext,
  ) {
    const metadata = asOpenApiMetadata(context.metadata)
    const name = String(context.name)

    const operation = ensureOperation(metadata, name)
    operation.responses ??= {}
    operation.responses[status] = response
  }

  return decorator
}
