import type { OperationMeta, SecurityRequirement } from './types'

import { asOpenApiMetadata } from './metadata'

export function ApiTag(name: string, description?: string) {
  return function (_target: any, context: ClassDecoratorContext): void {
    const metadata = asOpenApiMetadata(context.metadata)

    metadata.openapi.tag = { description, name }
  }
}

export function ApiOperation(operation: OperationMeta) {
  return function (
    _value: any,
    context: ClassMethodDecoratorContext | ClassFieldDecoratorContext,
  ): void {
    const metadata = asOpenApiMetadata(context.metadata)

    const handlerName = String(context.name)
    const existing = metadata.openapi.operations[handlerName]

    if (existing?.security) operation.security = existing.security

    metadata.openapi.operations[handlerName] = operation
  }
}

export function ApiSecurity(...requirements: SecurityRequirement[]) {
  return function (
    _value: any,
    context: ClassDecoratorContext | ClassMethodDecoratorContext | ClassFieldDecoratorContext,
  ): void {
    const metadata = asOpenApiMetadata(context.metadata)

    if (context.kind === 'class') {
      metadata.openapi.security = requirements
      return
    }

    const handlerName = String(context.name)
    const existing = metadata.openapi.operations[handlerName]

    if (existing) existing.security = requirements
    else metadata.openapi.operations[handlerName] = { security: requirements }
  }
}
