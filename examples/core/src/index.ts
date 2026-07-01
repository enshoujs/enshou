import { Application } from '@enshou/core'
import { OpenApiBuilder, scalarUi } from '@enshou/openapi'
import { toJsonSchema } from '@valibot/to-json-schema'

import { OrdersController } from './controllers/orders.controller'
import { ErrorHandler } from './error-handler'
import { AuthMiddleware, AUTH_MIDDLEWARE } from './middlewares/auth.middleware'
import { ORDER_ID_GENERATOR, RESTAURANT_CONFIG } from './schemas'
import { AuthService, AUTH_SERVICE } from './services/auth.service'
import { KitchenLogger, KITCHEN_LOGGER } from './services/kitchen.logger'
import { OrderService, ORDER_SERVICE } from './services/order.service'

const app = new Application({
  controllers: [OrdersController],
  providers: [
    { provide: AUTH_SERVICE, useClass: AuthService },
    { provide: AUTH_MIDDLEWARE, useClass: AuthMiddleware },
    { provide: KITCHEN_LOGGER, useClass: KitchenLogger },
    { provide: ORDER_SERVICE, useClass: OrderService },
    {
      provide: RESTAURANT_CONFIG,
      useValue: {
        restaurantName: 'Midnight Pizza',
        orderPrefix: 'pizza',
      },
    },
    {
      provide: ORDER_ID_GENERATOR,
      useFactory: (container) => {
        const config = container.resolve(RESTAURANT_CONFIG)
        let sequence = 100

        return {
          next() {
            sequence += 1
            return `${config.orderPrefix}-${sequence}`
          },
        }
      },
    },
  ],
  errorHandler: ErrorHandler,
})

const document = new OpenApiBuilder({
  controllers: app.controllers,
  schemaConverter: { toJsonSchema },
  info: {
    title: 'Midnight Pizza API',
    version: '1.0.0',
    description: 'API for managing pizza orders',
  },
}).toDocument()

export default (await app.instantiate())
  .get('/openapi.json', (c) => c.json(document))
  .get('/docs', scalarUi({ specUrl: '/openapi.json' }))
