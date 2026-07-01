import type { Middleware } from '@enshou/core'
import type { Context, Next } from 'hono'

import { createToken, Inject } from '@enshou/di'

import { AuthService, AUTH_SERVICE } from '../services/auth.service'

export const AUTH_MIDDLEWARE = createToken<AuthMiddleware>('auth-middleware')

@Inject(AUTH_SERVICE)
export class AuthMiddleware implements Middleware {
  constructor(private readonly auth: AuthService) {}

  async handle(c: Context, next: Next) {
    const token = c.req.header('Authorization')
    if (!this.auth.isValid(token)) {
      return c.json({ message: 'Unauthorized (Try Authorization: pizza-secret)' }, 401)
    }
    await next()
  }
}
