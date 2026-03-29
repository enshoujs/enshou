# @enshou/di

`@enshou/di` is a small dependency injection container for TypeScript with
explicit constructor metadata.

It supports typed symbol tokens, string keys, and class tokens. Dependencies are
declared with `@Inject(...)`, and instances can be resolved as singletons or
transients.

## Quick Example

```ts
import { Container, Inject, createToken } from '@enshou/di'

type AppConfig = {
  apiUrl: string
}

const CONFIG = createToken<AppConfig>('config')

class Logger {
  log(message: string) {
    console.log(message)
  }
}

@Inject([CONFIG, Logger])
class ApiClient {
  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {}

  ping() {
    this.logger.log(`GET ${this.config.apiUrl}/ping`)
  }
}

const container = new Container()

container.registerValue(CONFIG, {
  apiUrl: 'https://example.dev',
})

container.registerClass(Logger, Logger)
container.registerClass(ApiClient, ApiClient)

const api = container.resolve(ApiClient)
api.ping()
```

## API

### `createToken<T>(description)`

Creates a unique typed symbol token.

```ts
const USER_REPOSITORY = createToken<UserRepository>('user-repository')
```

Use tokens when you need a typed key that is independent from a concrete class.

### `new Container()`

Creates a new dependency container.

### `container.registerValue(token, value)`

Registers a prebuilt value under a token or string key.

```ts
container.registerValue(CONFIG, { apiUrl: 'https://example.dev' })
container.registerValue('port', 3000)
```

Values are stored in the singleton cache, so resolving the same key always
returns the same value.

### `container.registerClass(token, Class, scope?)`

Registers a class provider.

- `token` can be a typed token, a string, or a class
- `scope` defaults to `'singleton'`
- use `'transient'` to create a new instance on every `resolve`

```ts
container.registerClass(Logger, Logger)
container.registerClass(ApiClient, ApiClient, 'transient')
```

### `container.resolve(token)`

Resolves a dependency by token, string key, or class.

```ts
const logger = container.resolve(Logger)
const config = container.resolve(CONFIG)
```

Throws an `Error` if no value or provider has been registered for the requested
key.

### `@Inject(tokens)`

Declares constructor dependencies for a class.

The order of tokens must match the constructor parameter order.

```ts
@Inject([CONFIG, Logger])
class ApiClient {
  constructor(config: AppConfig, logger: Logger) {}
}
```

The container does not inspect TypeScript types at runtime. If a class has
dependencies, you must declare them explicitly with `@Inject(...)`.

## Container Behavior

- `registerValue` always stores the value in the singleton cache
- class dependencies are resolved recursively through `resolve`
- singleton providers are created lazily on first resolution
- transient providers are never cached
- classes without `@Inject(...)` are constructed with no dependencies

## Choosing Keys

- prefer `createToken<T>(...)` for typed non-class dependencies such as config,
  clients, or interfaces
- use class tokens when the class itself is the public key
- string keys work, but they are not type-safe

## Limitations

- dependencies must be declared explicitly with `@Inject(...)`
- only value providers and class providers are supported
- circular dependencies are not handled specially
- tokens are compared by identity, so registration and resolution must use the
  same token instance

## Exports

```ts
import { Container, Inject, createToken } from '@enshou/di'
import type { Scope, Token } from '@enshou/di'
```
