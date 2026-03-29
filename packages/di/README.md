# @enshou/di

A small dependency injection container for TypeScript.

It gives you a typed token system, a simple container, and an explicit
`@Inject(...)` decorator for constructor dependencies.

## Installation

```bash
pnpm add @enshou/di
```

## Quick example

```ts
import { Container, Inject, createToken } from '@enshou/di'

type AppConfig = {
  apiUrl: string
}

const CONFIG = createToken<AppConfig>('config')
const LOGGER = createToken<Logger>('logger')
const API = createToken<ApiClient>('api')

class Logger {
  log(message: string) {
    console.log(message)
  }
}

@Inject([CONFIG, LOGGER])
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

container.registerClass(LOGGER, Logger)
container.registerClass(API, ApiClient)

const api = container.resolve(API)
api.ping()
```

## API

### `createToken<T>(description)`

Creates a unique, typed token.

```ts
const USER_REPOSITORY = createToken<UserRepository>('user-repository')
```

### `new Container()`

Creates a new dependency container.

### `container.registerValue(token, value)`

Registers a prebuilt value.

Values are stored in the singleton cache, so resolving the same token always
returns the same instance.

```ts
container.registerValue(CONFIG, { apiUrl: 'https://example.dev' })
```

### `container.registerClass(token, Class, scope?)`

Registers a class provider for a token.

- `singleton` by default: the instance is created once and reused
- `transient`: a new instance is created on every `resolve`

```ts
container.registerClass(LOGGER, Logger, 'singleton')
container.registerClass(API, ApiClient, 'transient')
```

### `container.resolve(token)`

Resolves a dependency by token.

Throws if no provider has been registered for that token.

```ts
const logger = container.resolve(LOGGER)
```

### `@Inject(tokens)`

Declares the constructor dependencies for a class.

The order of tokens must match the order of constructor parameters.

```ts
@Inject([CONFIG, LOGGER])
class ApiClient {
  constructor(config: AppConfig, logger: Logger) {}
}
```

## Container behavior

- `registerValue` always stores the value in the singleton cache
- class dependencies are resolved recursively through `resolve`
- singleton instances are created lazily on first resolution
- transient instances are never cached

## Limitations

- dependencies are declared explicitly with `@Inject(...)`; constructor types are not read automatically
- the container only supports class providers and value providers
- circular dependencies are not handled specially
- tokens are compared by identity, so you must use the same token instance for registration and resolution

## Exports

```ts
import { Container, Inject, createToken } from '@enshou/di'
import type { Scope, Token } from '@enshou/di'
```
