# @enshou/zod

`@enshou/zod` is the official Zod adapter for `@enshou/core`
validation.

It connects route schemas declared in `@enshou/core` decorators to
[`zod`](https://zod.dev/) parsing.

## Quick Example

```ts
import { Application, Controller, Post, type Ctx } from '@enshou/core'
import { Inject } from '@enshou/di'
import { zodAdapter } from '@enshou/zod'
import * as z from 'zod'

const CreateUserSchema = z.object({
  json: z.object({
    name: z.string().min(1),
    age: z.number().int().min(18),
  }),
})

type CreateUserInput = z.infer<typeof CreateUserSchema>['json']
type CreateUserContext = Ctx<z.infer<typeof CreateUserSchema>>

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
  validator: zodAdapter(),
})

export default app.instantiate()
```

## API

### `zodAdapter()`

Creates a `ValidatorAdapter` implementation for `@enshou/core`.

```ts
import { zodAdapter } from '@enshou/zod'

const validator = zodAdapter()
```

## Schema Shape

`@enshou/core` passes a single object into the adapter's `parse(...)` method.
Shape your Zod schema around the request parts you want to validate:

```ts
const schema = z.object({
  json: z.object({
    name: z.string(),
  }),
  query: z
    .object({
      page: z.string(),
    }),
    .optional(),
  param: z
    .object({
      id: z.string(),
    }),
    .optional(),
})
```

The available keys are:

- `json` for JSON request bodies
- `query` for query string values
- `param` for route parameters

After parsing succeeds, the validated values are available through
`c.req.valid('json')`, `c.req.valid('query')`, and `c.req.valid('param')`.

## Runtime Behavior

- `zodAdapter()` returns an object with `name: 'zod'`
- the adapter uses `schema.safeParse(data)` internally
- validation issues are mapped from `ZodError.issues`

## Peer Dependencies

This package expects these libraries in the consuming app:

- `@enshou/core`
- `hono`
- `zod`

## Exports

```ts
import { zodAdapter } from '@enshou/zod'
```
