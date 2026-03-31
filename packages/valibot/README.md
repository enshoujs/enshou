# @enshou/valibot

`@enshou/valibot` is the official Valibot adapter for `@enshou/core`
validation.

It connects route schemas declared in `@enshou/core` decorators to
[`valibot`](https://valibot.dev/) parsing.

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

## API

### `valibotAdapter()`

Creates a `ValidatorAdapter` implementation for `@enshou/core`.

```ts
import { valibotAdapter } from '@enshou/valibot'

const validator = valibotAdapter()
```

## Schema Shape

`@enshou/core` passes a single object into the adapter's `parse(...)` method.
Shape your Valibot schema around the request parts you want to validate:

```ts
const schema = v.object({
  json: v.object({
    name: v.string(),
  }),
  query: v.optional(
    v.object({
      page: v.string(),
    }),
  ),
  param: v.optional(
    v.object({
      id: v.string(),
    }),
  ),
})
```

The available keys are:

- `json` for JSON request bodies
- `query` for query string values
- `param` for route parameters

After parsing succeeds, the validated values are available through
`c.req.valid('json')`, `c.req.valid('query')`, and `c.req.valid('param')`.

## Runtime Behavior

- `valibotAdapter()` returns an object with `name: 'valibot'`
- the adapter uses `v.parse(schema, data)` internally
- validation errors are thrown by Valibot and are not transformed by this
  package

## Peer Dependencies

This package expects these libraries in the consuming app:

- `@enshou/core`
- `hono`
- `valibot`

## Exports

```ts
import { valibotAdapter } from '@enshou/valibot'
```
