declare global {
  interface ObjectConstructor {
    entries<Object extends object>(obj: Object): [keyof Object, NonNullable<Object[keyof Object]>][]
  }
}

export {}
