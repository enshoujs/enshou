import { Container, Inject, createToken } from '@enshou/di'

type AppConfig = {
  appName: string
  apiUrl: string
}

const CONFIG = createToken<AppConfig>('config')
const LOGGER_TOKEN = createToken<Logger>('logger')
const HTTP_CLIENT_TOKEN = createToken<HttpClient>('http-client')
const USER_SERVICE_TOKEN = createToken<UserService>('user-service')
const BOOTSTRAP_TOKEN = createToken<Bootstrap>('bootstrap')

const container = new Container()

class Logger {
  log(message: string) {
    console.log(`[log] ${message}`)
  }
}

@Inject([CONFIG, LOGGER_TOKEN])
class HttpClient {
  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {}

  get(path: string) {
    const url = `${this.config.apiUrl}${path}`
    this.logger.log(`GET ${url}`)

    return {
      id: 1,
      name: 'Ada Lovelace',
    }
  }
}

@Inject([HTTP_CLIENT_TOKEN, LOGGER_TOKEN])
class UserService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly logger: Logger,
  ) {}

  loadUser(id: number) {
    this.logger.log(`Loading user ${id}`)
    return this.httpClient.get(`/users/${id}`)
  }
}

@Inject([USER_SERVICE_TOKEN, LOGGER_TOKEN])
class Bootstrap {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger,
  ) {}

  run() {
    const user = this.userService.loadUser(1)
    this.logger.log(`Resolved user: ${user.name}`)
  }
}

container.registerValue(CONFIG, {
  appName: 'di-example',
  apiUrl: 'https://example.dev/api',
})

container.registerClass(LOGGER_TOKEN, Logger, 'singleton')
container.registerClass(HTTP_CLIENT_TOKEN, HttpClient, 'singleton')
container.registerClass(USER_SERVICE_TOKEN, UserService, 'singleton')
container.registerClass(BOOTSTRAP_TOKEN, Bootstrap, 'transient')

const bootstrap1 = container.resolve(BOOTSTRAP_TOKEN)
const bootstrap2 = container.resolve(BOOTSTRAP_TOKEN)
const logger1 = container.resolve(LOGGER_TOKEN)
const logger2 = container.resolve(LOGGER_TOKEN)

console.log('bootstrap singleton?', bootstrap1 === bootstrap2)
console.log('logger singleton?', logger1 === logger2)

bootstrap1.run()
