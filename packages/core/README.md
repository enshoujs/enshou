# @enshou/core

`@enshou/core` is a small decorator-based HTTP layer built on top of
[`hono`](https://hono.dev/) and `@enshou/di`.

It lets you declare controllers with route decorators, resolve them through the
DI container, and instantiate a Hono application from those classes.

## Quick Example

```ts
import { Application, Controller, Post, type Ctx } from '@enshou/core'
import { Inject } from '@enshou/di'
import { valibotAdapter } from '@enshou/valibot'
import * as v from 'valibot'

const CreateUserSchema = v.object({
  json: v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    age: v.pipe(v.number(), v.integer(), v.minValue(18)),
  }),
})

type CreateUserInput = v.InferOutput<typeof CreateUserSchema>['json']
type CreateUserContext = Ctx<v.InferOutput<typeof CreateUserSchema>>

class UserService {
  createUser(input: CreateUserInput) {
    return {
      id: 1,
      ...input,
    }
  }
}

@Controller('/users')
@Inject([UserService])
class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/', CreateUserSchema)
  createUser(c: CreateUserContext) {
    const input = c.req.valid('json')
    return c.json(this.userService.createUser(input), 201)
  }
}

const app = new Application({
  controllers: [UserController],
  services: [UserService],
  validator: valibotAdapter(),
})

export default app.instantiate()
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

### Validation

Routes can optionally declare a schema as the second argument to a route
decorator. If the application is configured with a `validator`, the request data
is parsed before the handler runs.

`@enshou/core` passes this object to the validator adapter:

```ts
{
  json,
  query,
  param,
}
```

Validated values are then exposed through Hono's `c.req.valid(...)` helpers.

## API

### `new Application(options)`

Creates an application builder.

```ts
const app = new Application({
  controllers: [UserController],
  services: [UserService],
  validator: valibotAdapter(),
})
```

`options` has this shape:

```ts
type ApplicationOptions = {
  controllers?: Array<new (...args: any[]) => any>
  services?: Array<new (...args: any[]) => any>
  validator?: ValidatorAdapter<any>
}
```

### `application.instantiate()`

Registers the configured controllers and services in an internal DI container
and returns a `Hono` application.

```ts
const hono = app.instantiate()
```

### `@Controller(prefix?)`

Sets the route prefix for a controller.

```ts
@Controller('/users')
class UserController {}
```

The default prefix is `'/'`.

### Route Decorators

The package exports these decorators:

- `@Get(path, schema?)`
- `@Post(path, schema?)`
- `@Put(path, schema?)`
- `@Patch(path, schema?)`
- `@Delete(path, schema?)`

Each decorator registers a route handler on the controller. They can be applied
to class methods or class fields.

```ts
@Post('/', CreateUserSchema)
createUser(c: CreateUserContext) {
  const input = c.req.valid('json')
  return c.json(input, 201)
}
```

### `Ctx<Out, E>`

`Ctx` is a typed alias for `hono`'s `Context` that lets you describe validated
output data and environment overrides.

```ts
type CreateUserContext = Ctx<v.InferOutput<typeof CreateUserSchema>>
```

### `GlobalEnv`

`GlobalEnv` can be extended with module augmentation to describe shared Hono
environment bindings and variables.

```ts
declare module '@enshou/core' {
  interface GlobalEnv {
    Variables: {
      requestId: string
    }
  }
}
```

### `ValidatorAdapter<Schema>`

Validator adapters let `Application` integrate with a schema library.

```ts
interface ValidatorAdapter<Schema = unknown> {
  name: string
  parse(schema: Schema, value: unknown): unknown
}
```

See `@enshou/valibot` for the official Valibot adapter.

## Handler Notes

Handlers are passed directly to Hono.

```ts
@Get('/')
list = (c) => c.text('ok')
```

```ts
@Get('/')
list(c) {
  return c.text('ok')
}
```

## Runtime Behavior

- each configured controller is registered in the DI container using the class
  itself as the key
- each configured service is registered in the same way
- routes are collected from decorators and attached to the Hono app during
  `instantiate()`
- controller prefixes and route paths are normalized into a single path
- validation middleware runs only when both a route schema and `options.validator`
  are present

## Limitations

- only classes listed in `controllers` and `services` are registered
- dependency injection still requires explicit `@Inject(...)` metadata from
  `@enshou/di`
- validation depends on an external adapter such as `@enshou/valibot`
- there is no module system, provider factory API, or lifecycle hook system in
  this package

## Exports

```ts
import { Application, Controller, Delete, Get, Patch, Post, Put } from '@enshou/core'
import type { ApplicationOptions, Ctx, GlobalEnv, ValidatorAdapter } from '@enshou/core'
```
