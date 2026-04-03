import { getControllerMetadata } from './metadata'

export function Controller(prefix: string = '/') {
  return function (target: any, _context?: ClassDecoratorContext): void {
    getControllerMetadata(target).prefix = prefix
  }
}
