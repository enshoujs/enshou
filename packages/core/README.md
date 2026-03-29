# @enshou/core

`@enshou/core` is a small decorator-based HTTP layer built on top of
[`hono`](https://hono.dev/) and `@enshou/di`.

It lets you declare controllers with route decorators, register services, and
build a Hono application from those classes.

## Quick Example

```ts
import type { Context } from 'hono'

import { Application, Controller, Get } from '@enshou/core'
import { Inject } from '@enshou/di'

class UserService {
  getUsers() {
    return [{ id: 1, name: 'Alice' }]
  }
}

@Controller('/users')
@Inject([UserService])
class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/all')
  getUsers = (c: Context) => {
    return c.json(this.userService.getUsers())
  }
}

const application = new Application({
  controllers: [UserController],
  services: [UserService],
})

export default application.instantiate()
```

## Concepts

### Controllers

Controllers are classes decorated with `@Controller(prefix)`. Their route
handlers are marked with HTTP method decorators such as `@Get(...)` and
`@Post(...)`.

### Services

Services are plain classes registered in the application configuration. They are
resolved through `@enshou/di` and can be injected into controllers or other
services.

### Dependency Injection

Constructor dependencies are declared with `@Inject(...)` from `@enshou/di`.
`@enshou/core` does not infer constructor parameter types automatically.

## API

### `new Application(options)`

Creates an application builder.

```ts
const application = new Application({
  controllers: [UserController],
  services: [UserService],
})
```

`options` has this shape:

```ts
type ApplicationOptions = {
  controllers: Array<new (...args: any[]) => any>
  services: Array<new (...args: any[]) => any>
}
```

### `application.instantiate()`

Registers the configured controllers and services in an internal DI container
and returns a `Hono` application.

```ts
const app = application.instantiate()
```

### `@Controller(prefix?)`

Sets the route prefix for a controller.

```ts
@Controller('/users')
class UserController {}
```

The default prefix is an empty string.

### Route Decorators

The package exports these decorators:

- `@Get(path?)`
- `@Post(path?)`
- `@Put(path?)`
- `@Patch(path?)`
- `@Delete(path?)`

Each decorator registers a route handler on the controller. They can be applied
to class methods or class fields.

```ts
@Get('/')
list = (c: Context) => c.text('ok')
```

The default path is `'/'`.

## Handler Notes

Handlers are passed directly to Hono.

```ts
@Get('/')
list = (c: Context) => c.json(this.userService.getUsers())
```

```ts
@Get('/')
list(c: Context) {
 c.json(this.userService.getUsers())
}
```

## Runtime Behavior

- each configured controller is registered in the DI container using the class
  itself as the key
- each configured service is registered in the same way
- routes are collected from decorators and attached to the Hono app during
  `instantiate()`
- controller prefixes and route paths are normalized into a single path

## Limitations

- only classes listed in `controllers` and `services` are registered
- dependency injection still requires explicit `@Inject(...)` metadata from
  `@enshou/di`
- there is no module system, provider factory API, or lifecycle hook system in
  this package

## Exports

```ts
import {
  Application,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
} from '@enshou/core'
import type { ApplicationOptions } from '@enshou/core'
```
