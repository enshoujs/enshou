export const PREFIX_KEY: unique symbol = Symbol()

export function Controller(prefix: string = '/') {
  return function (target: any, _context?: ClassDecoratorContext): void {
    target[PREFIX_KEY] = prefix
  }
}
