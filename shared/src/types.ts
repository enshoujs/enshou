export type IsAny<Value> = 0 extends 1 & Value ? true : false
export type AnyFunction = (...args: any[]) => any
export type Class<T = unknown> = new (...args: any[]) => T
export type HttpMethod = 'GET' | 'QUERY' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'
export type ClassMethodDecorator = (target: any, context: ClassMethodDecoratorContext) => void
export type ClassFieldDecorator = (target: any, context: ClassFieldDecoratorContext) => void
export type ClassDecorator = (target: any, context: ClassDecoratorContext) => void
