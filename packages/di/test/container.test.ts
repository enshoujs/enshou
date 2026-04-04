import { beforeEach, expect, it } from 'vitest'

import { Container, Inject, createToken } from '../src'

let container: Container

beforeEach(() => {
  container = new Container()
})

it('should return same value for value provider', () => {
  const TOKEN = createToken('token')
  const value = { PORT: 5000 }

  container.registerValue(TOKEN, value)

  expect(container.resolve(TOKEN)).toBe(container.resolve(TOKEN))
  expect(container.resolve(TOKEN)).toBe(value)
})

it('should return correct instance for class provider', () => {
  const TOKEN = createToken('token')
  class Class {}

  container.registerClass(TOKEN, Class)

  expect(container.resolve(TOKEN)).toBeInstanceOf(Class)
})

it('should resolve value registered by class token', () => {
  class Config {}

  const value = new Config()

  container.registerValue(Config, value)

  expect(container.resolve(Config)).toBe(value)
})

it('should be singleton', () => {
  const TOKEN = createToken<Class>('token')
  class Class {}

  container.registerClass(TOKEN, Class)

  expect(container.resolve(TOKEN)).toBe(container.resolve(TOKEN))
})

it('should be transient', () => {
  const TOKEN = createToken<Class>('token')
  class Class {}

  container.registerClass(TOKEN, Class, 'transient')

  expect(container.resolve(TOKEN)).not.toBe(container.resolve(TOKEN))
})

it('should register class provider objects', () => {
  const TOKEN = createToken<Class>('token')
  class Class {}

  container.register({
    provide: TOKEN,
    useClass: Class,
  })

  expect(container.resolve(TOKEN)).toBeInstanceOf(Class)
})

it('should resolve singleton factory providers once', () => {
  const TOKEN = createToken<{ id: number }>('token')
  let calls = 0

  container.register({
    provide: TOKEN,
    useFactory: () => {
      calls += 1

      return { id: calls }
    },
  })

  expect(container.resolve(TOKEN)).toBe(container.resolve(TOKEN))
  expect(calls).toBe(1)
})

it('should resolve transient factory providers each time', () => {
  const TOKEN = createToken<{ id: number }>('token')
  let calls = 0

  container.register({
    provide: TOKEN,
    useFactory: () => ({ id: ++calls }),
    scope: 'transient',
  })

  expect(container.resolve(TOKEN)).not.toBe(container.resolve(TOKEN))
  expect(calls).toBe(2)
})

it('should resolve class without inject decorator', () => {
  const TOKEN = createToken('token')
  class Class {}

  container.registerClass(TOKEN, Class)

  expect(container.resolve(TOKEN)).toBeInstanceOf(Class)
})

it('should resolve dependencies in correct order', () => {
  const TOKEN1 = createToken<Class1>('token')
  class Class1 {}

  const TOKEN2 = createToken<Class2>('token')
  class Class2 {}

  const TOKEN3 = createToken<Class3>('token')
  @Inject([TOKEN1, TOKEN2])
  class Class3 {
    class2: Class2
    class1: Class1
    constructor(class1: Class1, class2: Class2) {
      this.class1 = class1
      this.class2 = class2
    }
  }

  container.registerClass(TOKEN1, Class1)
  container.registerClass(TOKEN2, Class2)
  container.registerClass(TOKEN3, Class3)

  const class3 = container.resolve(TOKEN3)

  expect(class3).toBeDefined()
  expect(class3.class1).toBeDefined()
  expect(class3.class2).toBeDefined()

  expect(class3).toBeInstanceOf(Class3)
  expect(class3.class1).toBeInstanceOf(Class1)
  expect(class3.class2).toBeInstanceOf(Class2)
})

it('should resolve recursive dependencies', () => {
  const TOKEN1 = createToken<Class1>('token')
  class Class1 {}

  const TOKEN2 = createToken<Class2>('token')
  @Inject([TOKEN1])
  class Class2 {
    class1: Class1
    constructor(class1: Class1) {
      this.class1 = class1
    }
  }

  const TOKEN3 = createToken<Class3>('token')
  @Inject([TOKEN2])
  class Class3 {
    class2: Class2
    constructor(class2: Class2) {
      this.class2 = class2
    }
  }

  container.registerClass(TOKEN1, Class1)
  container.registerClass(TOKEN2, Class2)
  container.registerClass(TOKEN3, Class3)

  const class3 = container.resolve(TOKEN3)

  expect(class3).toBeDefined()
  expect(class3.class2).toBeDefined()
  expect(class3.class2.class1).toBeDefined()

  expect(class3).toBeInstanceOf(Class3)
  expect(class3.class2).toBeInstanceOf(Class2)
  expect(class3.class2.class1).toBeInstanceOf(Class1)
})

it('should reuse singleton dependency inside transient provider', () => {
  const TOKEN1 = createToken<Class1>('token')
  class Class1 {}

  const TOKEN2 = createToken<Class2>('token')
  @Inject([TOKEN1])
  class Class2 {
    class1: Class1
    constructor(class1: Class1) {
      this.class1 = class1
    }
  }

  container.registerClass(TOKEN1, Class1)
  container.registerClass(TOKEN2, Class2, 'transient')

  const class2a = container.resolve(TOKEN2)
  const class2b = container.resolve(TOKEN2)

  expect(class2a).not.toBe(class2b)
  expect(class2a.class1).toBe(class2b.class1)
})

it('should create transient dependency once for singleton provider', () => {
  const TOKEN1 = createToken<Class1>('token')
  class Class1 {}

  const TOKEN2 = createToken<Class2>('token')
  @Inject([TOKEN1])
  class Class2 {
    class1: Class1
    constructor(class1: Class1) {
      this.class1 = class1
    }
  }

  container.registerClass(TOKEN1, Class1, 'transient')
  container.registerClass(TOKEN2, Class2)

  const class2a = container.resolve(TOKEN2)
  const class2b = container.resolve(TOKEN2)

  expect(class2a).toBe(class2b)
  expect(class2a.class1).toBe(class2b.class1)
})

it('should throw on invalid token', () => {
  const TOKEN = createToken<Class>('token')
  class Class {}

  expect(() => container.resolve(TOKEN)).toThrow(Error)
})

it('should throw invalid recursive token', () => {
  const TOKEN1 = createToken<Class1>('token')
  class Class1 {}

  const TOKEN2 = createToken<Class2>('token')
  @Inject([TOKEN1])
  class Class2 {
    class1: Class1
    constructor(class1: Class1) {
      this.class1 = class1
    }
  }

  container.registerClass(TOKEN2, Class2)

  expect(() => container.resolve(TOKEN2)).toThrow(Error)
})
