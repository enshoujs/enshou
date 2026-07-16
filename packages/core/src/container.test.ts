import { beforeEach, describe, expect, expectTypeOf, it, mock } from 'bun:test'

import type { ResolutionContext, Token } from './container'
import type { OnInit } from './lifecycle'

import { Container } from './container'
import { Inject } from './decorators'

let container: Container

beforeEach(() => {
  container = new Container()
})

describe('register', () => {
  it('should throw for a non-symbol token', () => {
    const INVALID_TOKEN: any = ''

    class Class {}

    expect(() => {
      container.register({ provide: INVALID_TOKEN, useValue: 'foo' })
    }).toThrow(/must be a symbol/)
    expect(() => {
      container.register({ provide: INVALID_TOKEN, useClass: Class })
    }).toThrow(/must be a symbol/)
    expect(() => {
      container.register({
        provide: INVALID_TOKEN,
        useFactory: () => {
          return 'bar'
        },
      })
    }).toThrow(/must be a symbol/)
  })

  it('should not throw for a symbol token', () => {
    const VALID_TOKEN = Symbol() as Token<any>

    class Class {}

    expect(() => {
      container.register({ provide: VALID_TOKEN, useValue: 'foo' })
    }).not.toThrow()
    expect(() => {
      container.register({ provide: VALID_TOKEN, useClass: Class })
    }).not.toThrow()
    expect(() => {
      container.register({
        provide: VALID_TOKEN,
        useFactory: () => {
          return 'bar'
        },
      })
    }).not.toThrow()
  })
})

describe('resolve', () => {
  it('should throw for non-existing provider', () => {
    const TOKEN = Symbol() as Token<any>

    expect(async () => {
      await container.resolve(TOKEN)
    }).toThrow(/No provider for/)
  })

  it('should return value of the same reference for useValue provider', async () => {
    const TOKEN = Symbol() as Token<any>

    const value = { foo: 'bar' }

    container.register({ provide: TOKEN, useValue: value })

    const resolved = await container.resolve(TOKEN)

    expect(resolved).toBe(value)
  })

  it('should return instance of the provided class for useClass provider', async () => {
    const CLASS = Symbol() as Token<any>

    class Class {}

    container.register({ provide: CLASS, useClass: Class })

    const resolved = await container.resolve(CLASS)

    expect(resolved).toBeInstanceOf(Class)
  })

  it('should return correct value for useFactory provider', async () => {
    const TOKEN = Symbol() as Token<any>

    const value = { foo: 'bar' }

    container.register({
      provide: TOKEN,
      useFactory: () => {
        return value
      },
    })

    const resolved = await container.resolve(TOKEN)

    expect(resolved).toEqual(value)
  })

  it('should return the same reference for singleton useClass provider', async () => {
    const token = Symbol() as Token<any>

    class Class {}

    container.register({ provide: token, useClass: Class })

    expect(await container.resolve(token)).toBe(await container.resolve(token))
  })

  it('should not return the same reference for transient useClass provider', async () => {
    const token = Symbol() as Token<any>

    class Class {}

    container.register({ provide: token, scope: 'transient', useClass: Class })

    expect(await container.resolve(token)).not.toBe(await container.resolve(token))
  })

  it('should return the same reference for singleton useFactory provider', async () => {
    const token = Symbol() as Token<any>

    container.register({
      provide: token,
      useFactory: () => {
        return { foo: 'bar' }
      },
    })

    expect(await container.resolve(token)).toBe(await container.resolve(token))
  })

  it('should not return the same reference for transient useFactory provider', async () => {
    const token = Symbol() as Token<any>

    container.register({
      provide: token,
      scope: 'transient',
      useFactory: () => {
        return { foo: 'bar' }
      },
    })

    expect(await container.resolve(token)).not.toBe(await container.resolve(token))
  })

  it('should return correct instances for nested dependecies', async () => {
    const DEPENDENCY1 = Symbol() as Token<Dependency1>
    class Dependency1 {}

    const DEPENDENCY2 = Symbol() as Token<Dependency2>
    class Dependency2 {
      @Inject(DEPENDENCY1) dependency1!: Dependency1
    }

    const CLASS = Symbol() as Token<Class>
    class Class {
      @Inject(DEPENDENCY2) dependency2!: Dependency2
    }

    container.register({ provide: DEPENDENCY1, useClass: Dependency1 })
    container.register({ provide: DEPENDENCY2, useClass: Dependency2 })
    container.register({ provide: CLASS, useClass: Class })

    const resolved = await container.resolve(CLASS)

    expect(resolved).toBeInstanceOf(Class)
    expect(resolved.dependency2).toBeInstanceOf(Dependency2)
    expect(resolved.dependency2.dependency1).toBeInstanceOf(Dependency1)
  })

  it('should throw on circular dependency', () => {
    const CLASS = Symbol() as Token<Class>
    class Class {
      @Inject(CLASS) dependency!: Class
    }

    container.register({ provide: CLASS, useClass: Class })

    expect(async () => {
      await container.resolve(CLASS)
    }).toThrow(/Circular dependency/)
  })

  it('should call onInit for useClass provider', async () => {
    const onInit = mock()

    const CLASS = Symbol() as Token<Class>
    class Class implements OnInit {
      onInit = onInit
    }

    container.register({ provide: CLASS, useClass: Class })

    await container.resolve(CLASS)

    expect(onInit).toHaveBeenCalled()
  })

  it('should call onInit for nested useClass providers', async () => {
    const onInit1 = mock()

    const DEPENDENCY1 = Symbol() as Token<Dependency1>
    class Dependency1 implements OnInit {
      onInit = onInit1
    }

    const onInit2 = mock()
    const DEPENDENCY2 = Symbol() as Token<Dependency2>
    class Dependency2 implements OnInit {
      @Inject(DEPENDENCY1) dependency1!: Dependency1
      onInit = onInit2
    }

    const CLASS = Symbol() as Token<Class>
    class Class {
      @Inject(DEPENDENCY2) dependency2!: Dependency2
    }

    container.register({ provide: DEPENDENCY1, useClass: Dependency1 })
    container.register({ provide: DEPENDENCY2, useClass: Dependency2 })
    container.register({ provide: CLASS, useClass: Class })

    await container.resolve(CLASS)

    expect(onInit1).toHaveBeenCalled()
    expect(onInit2).toHaveBeenCalled()
  })

  it('should call useFactory exactly once for singleton scope', async () => {
    const TOKEN = Symbol() as Token<any>

    const factory = mock()

    container.register({ provide: TOKEN, useFactory: factory })

    await container.resolve(TOKEN)
    await container.resolve(TOKEN)
    await container.resolve(TOKEN)

    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('should call useFactory each time for transient scope', async () => {
    const TOKEN = Symbol() as Token<any>

    const factory = mock()

    container.register({ provide: TOKEN, scope: 'transient', useFactory: factory })

    await container.resolve(TOKEN)
    await container.resolve(TOKEN)
    await container.resolve(TOKEN)

    expect(factory).toHaveBeenCalledTimes(3)
  })

  it('should instantiate useClass exactly once for singleton scope', async () => {
    const TOKEN = Symbol() as Token<any>

    const ctor = mock()
    class Class {
      constructor() {
        ctor()
      }
    }

    container.register({ provide: TOKEN, useClass: Class })

    await container.resolve(TOKEN)
    await container.resolve(TOKEN)
    await container.resolve(TOKEN)

    expect(ctor).toHaveBeenCalledTimes(1)
  })

  it('should instantiate useClass each time for transient scope', async () => {
    const TOKEN = Symbol() as Token<any>

    const ctor = mock()
    class Class {
      constructor() {
        ctor()
      }
    }

    container.register({ provide: TOKEN, scope: 'transient', useClass: Class })

    await container.resolve(TOKEN)
    await container.resolve(TOKEN)
    await container.resolve(TOKEN)

    expect(ctor).toHaveBeenCalledTimes(3)
  })

  it('should call onInit exactly once for singleton useClass provider', async () => {
    const onInit = mock()

    const CLASS = Symbol() as Token<any>
    class Class implements OnInit {
      onInit = onInit
    }

    container.register({ provide: CLASS, useClass: Class })

    await container.resolve(CLASS)
    await container.resolve(CLASS)
    await container.resolve(CLASS)

    expect(onInit).toHaveBeenCalledTimes(1)
  })

  it('should call onInit each time for transient useClass provider', async () => {
    const onInit = mock()

    const CLASS = Symbol() as Token<any>
    class Class implements OnInit {
      onInit = onInit
    }

    container.register({ provide: CLASS, scope: 'transient', useClass: Class })

    await container.resolve(CLASS)
    await container.resolve(CLASS)
    await container.resolve(CLASS)

    expect(onInit).toHaveBeenCalledTimes(3)
  })

  it('should pass a container instance with resolve to useFactory', async () => {
    const TOKEN = Symbol() as Token<any>

    let receivedContainer: Container | undefined

    container.register({
      provide: TOKEN,
      useFactory: (c) => {
        receivedContainer = c
      },
    })

    await container.resolve(TOKEN)

    expect(receivedContainer).toBeInstanceOf(Container)
    // oxlint-disable-next-line
    expectTypeOf(receivedContainer!.resolve).toBeFunction()
  })

  it('should pass correct context to useFactory', async () => {
    const TOKEN = Symbol() as Token<any>

    let capturedContext: ResolutionContext | undefined

    container.register({
      provide: TOKEN,
      useFactory: (_, context) => {
        capturedContext = { ...context, stack: [...context.stack] }
      },
    })

    await container.resolve(TOKEN)

    expect(capturedContext!.token).toBe(TOKEN)
    expect(capturedContext!.stack.length).toBeGreaterThan(0)
    expect(capturedContext!.root!.token).toBe(TOKEN)
    expect(capturedContext!.root!.kind).toBe('factory')
  })

  it('should pass correct context.parent to nested useFactory', async () => {
    const CHILD = Symbol() as Token<any>
    const PARENT = Symbol() as Token<any>

    let childContext: ResolutionContext | undefined

    container.register({
      provide: CHILD,
      useFactory: (_, context) => {
        childContext = context
      },
    })

    container.register({
      provide: PARENT,
      useFactory: async (c) => {
        await c.resolve(CHILD)
      },
    })

    await container.resolve(PARENT)

    expect(childContext!.parent!.token).toBe(PARENT)
    expect(childContext!.parent!.kind).toBe('factory')
  })

  it('should pass undefined context.parent to useFactory when resolved at root level', async () => {
    const TOKEN = Symbol() as Token<any>

    let capturedContext: ResolutionContext | undefined

    container.register({
      provide: TOKEN,
      useFactory: (_, context) => {
        capturedContext = context
      },
    })

    await container.resolve(TOKEN)

    expect(capturedContext!.parent).toBeUndefined()
  })
})
