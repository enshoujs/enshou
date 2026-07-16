import type { IsAny } from '#/shared/types'

type EntryKey<Value> = IsAny<Value> extends true ? string : `${Exclude<keyof Value, symbol>}`
type EntryValue<Value> = IsAny<Value> extends true ? any : NonNullable<Value[keyof Value]>

declare global {
  interface ObjectConstructor {
    entries<Object extends object>(obj: Object): [EntryKey<Object>, EntryValue<Object>][]
  }
}

export {}
