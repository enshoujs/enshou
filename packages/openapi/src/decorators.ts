import type { OpenApiControllerMeta, OperationMeta, SecurityRequirement } from './types'

if (!Symbol.metadata) {
  ;(Symbol as any).metadata = Symbol.for('Symbol.metadata')
}

export function getOpenApiMeta(metadata: Record<PropertyKey, any>): OpenApiControllerMeta {
  metadata.openapi ??= { operations: new Map() }
  return metadata.openapi as OpenApiControllerMeta
}

export function ApiTag(name: string, description?: string) {
  return function (_target: any, context: ClassDecoratorContext): void {
    const meta = getOpenApiMeta(context.metadata)
    meta.tag = { name, description }
  }
}

export function ApiOperation(operation: OperationMeta) {
  return function (
    _value: any,
    context: ClassMethodDecoratorContext | ClassFieldDecoratorContext,
  ): void {
    const meta = getOpenApiMeta(context.metadata)
    const handlerName = String(context.name)
    const existing = meta.operations.get(handlerName)

    if (existing) meta.operations.set(handlerName, { ...existing, ...operation })
    else meta.operations.set(handlerName, operation)
  }
}

export function ApiSecurity(...requirements: SecurityRequirement[]) {
  return function (
    _value: any,
    context: ClassDecoratorContext | ClassMethodDecoratorContext | ClassFieldDecoratorContext,
  ): void {
    const meta = getOpenApiMeta(context.metadata)

    if (context.kind === 'class') {
      meta.security = requirements
      return
    }

    const handlerName = String(context.name)
    const existing = meta.operations.get(handlerName)

    if (existing) existing.security = requirements
    else meta.operations.set(handlerName, { security: requirements })
  }
}
