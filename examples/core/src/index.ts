import type { Ctx } from '@enshou/core'
import type { InferSchema } from '@enshou/valibot'

import { Application, Controller, Post } from '@enshou/core'
import { Inject } from '@enshou/di'
import { valibotAdapter } from '@enshou/valibot'
import * as v from 'valibot'

class UserService {
  createUser(input: any) {
    return {
      id: 1,
      ...input,
    }
  }
}

const CreateUserSchema = {
  json: v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    age: v.pipe(v.number(), v.integer(), v.minValue(18)),
  }),
}
type CreateUserData = InferSchema<typeof CreateUserSchema>

@Controller('/users')
@Inject([UserService])
class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/', CreateUserSchema)
  createUser(c: Ctx<CreateUserData>) {
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
