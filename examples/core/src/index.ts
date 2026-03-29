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
  constructor(private userService: UserService) {}

  @Get('/all')
  getUsers = (c: Context) => {
    return c.json(this.userService.getUsers())
  }
}

const app = new Application({
  controllers: [UserController],
  services: [UserService],
})

export default app.instantiate()
