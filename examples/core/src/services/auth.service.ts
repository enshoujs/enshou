import { createToken } from '@enshou/di'

export const AUTH_SERVICE = createToken<AuthService>('auth-service')

export class AuthService {
  isValid(token?: string) {
    return token === 'pizza-secret'
  }
}
