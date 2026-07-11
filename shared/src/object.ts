import { omitBy } from 'es-toolkit'

export function compactObject<Object extends Record<string, any>>(obj: Object): Object {
  return omitBy(obj, (value) => value === undefined) as Object
}
