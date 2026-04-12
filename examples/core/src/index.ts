import type { Ctx } from '@enshou/core/http'
import type { InjectableMiddleware } from '@enshou/core/middleware'
import type { InferSchema } from '@enshou/valibot'
import type { Context, Next } from 'hono'

import { Application, Controller, Delete, Get, Patch, Post, Put, Use } from '@enshou/core'
import { ValidationError } from '@enshou/core/validation'
import { Inject, createToken } from '@enshou/di'
import { valibotAdapter } from '@enshou/valibot'
import * as v from 'valibot'

type RestaurantConfig = {
  restaurantName: string
  orderPrefix: string
}

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered'

type OrderIdGenerator = {
  next(): string
}

type Order = {
  id: string
  table: number
  customerName: string
  items: string[]
  status: OrderStatus
  notes?: string
}

const RESTAURANT_CONFIG = createToken<RestaurantConfig>('restaurant-config')
const ORDER_ID_GENERATOR = createToken<OrderIdGenerator>('order-id-generator')

const OrderStatusSchema = v.union([
  v.literal('pending'),
  v.literal('preparing'),
  v.literal('ready'),
  v.literal('delivered'),
])

const OrderIdSchema = {
  param: v.object({
    id: v.string(),
  }),
}

const ListOrdersSchema = {
  query: v.object({
    status: v.optional(OrderStatusSchema),
    customerName: v.optional(v.pipe(v.string(), v.minLength(1))),
  }),
}

const CreateOrderSchema = {
  json: v.object({
    table: v.pipe(v.number(), v.integer(), v.minValue(1)),
    customerName: v.pipe(v.string(), v.minLength(1)),
    items: v.array(v.pipe(v.string(), v.minLength(1))),
    notes: v.optional(v.pipe(v.string(), v.minLength(1))),
  }),
}

const ReplaceOrderSchema = {
  param: OrderIdSchema.param,
  json: v.object({
    table: v.pipe(v.number(), v.integer(), v.minValue(1)),
    customerName: v.pipe(v.string(), v.minLength(1)),
    items: v.array(v.pipe(v.string(), v.minLength(1))),
    status: OrderStatusSchema,
    notes: v.optional(v.pipe(v.string(), v.minLength(1))),
  }),
}

const UpdateOrderStatusSchema = {
  param: OrderIdSchema.param,
  json: v.object({
    status: OrderStatusSchema,
  }),
}

type OrderIdData = InferSchema<typeof OrderIdSchema>
type ListOrdersData = InferSchema<typeof ListOrdersSchema>
type CreateOrderData = InferSchema<typeof CreateOrderSchema>
type ReplaceOrderData = InferSchema<typeof ReplaceOrderSchema>
type UpdateOrderStatusData = InferSchema<typeof UpdateOrderStatusSchema>

const loggerMiddleware = async (c: Context, next: Next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(`[HTTP] ${c.req.method} ${c.req.url} - ${ms}ms`)
}

class AuthService {
  isValid(token?: string) {
    return token === 'pizza-secret'
  }
}

@Inject(AuthService)
class AuthMiddleware implements InjectableMiddleware {
  constructor(private readonly auth: AuthService) {}

  async use(c: Context, next: Next) {
    const token = c.req.header('Authorization')
    if (!this.auth.isValid(token)) {
      return c.json({ message: 'Unauthorized (Try Authorization: pizza-secret)' }, 401)
    }
    await next()
  }
}

class KitchenLogger {
  log(message: string) {
    console.log(`[kitchen] ${message}`)
  }
}

@Inject(RESTAURANT_CONFIG, ORDER_ID_GENERATOR, KitchenLogger)
class OrderService {
  private readonly orders: Order[]

  constructor(
    private readonly config: RestaurantConfig,
    private readonly orderIds: OrderIdGenerator,
    private readonly logger: KitchenLogger,
  ) {
    this.orders = [
      this.createInitialOrder({
        table: 4,
        customerName: 'Mira',
        items: ['Margherita', 'Lemonade'],
        status: 'preparing',
      }),
      this.createInitialOrder({
        table: 8,
        customerName: 'Jon',
        items: ['Pepperoni'],
        status: 'ready',
        notes: 'Extra napkins',
      }),
    ]
  }

  list(filters: { status?: OrderStatus; customerName?: string }): Order[] {
    return this.orders.filter((order) => {
      if (filters.status && order.status !== filters.status) return false

      if (filters.customerName) {
        const query = filters.customerName.toLowerCase()
        if (!order.customerName.toLowerCase().includes(query)) return false
      }

      return true
    })
  }

  getById(id: string): Order | undefined {
    return this.orders.find((order) => order.id === id)
  }

  create(input: CreateOrderData['json']): Order {
    const order = {
      id: this.orderIds.next(),
      ...input,
      status: 'pending' as const,
    }

    this.orders.push(order)
    this.logger.log(`Created ${order.id} for table ${order.table} at ${this.config.restaurantName}`)
    return order
  }

  replace(id: string, input: ReplaceOrderData['json']): Order | undefined {
    const index = this.orders.findIndex((order) => order.id === id)
    if (index === -1) return

    const order = {
      id,
      ...input,
    }

    this.orders[index] = order
    this.logger.log(`Replaced ${id}`)
    return order
  }

  updateStatus(id: string, status: OrderStatus): Order | undefined {
    const order = this.getById(id)
    if (!order) return

    order.status = status
    this.logger.log(`Updated ${id} to ${status}`)
    return order
  }

  remove(id: string): boolean {
    const index = this.orders.findIndex((order) => order.id === id)
    if (index === -1) return false

    this.orders.splice(index, 1)
    this.logger.log(`Removed ${id}`)
    return true
  }

  private createInitialOrder(input: Omit<Order, 'id'>): Order {
    return {
      id: this.orderIds.next(),
      ...input,
    }
  }
}

@Use(loggerMiddleware)
@Controller('/orders')
@Inject(OrderService, RESTAURANT_CONFIG)
class OrdersController {
  constructor(
    private readonly orders: OrderService,
    private readonly config: RestaurantConfig,
  ) {}

  @Get('/', ListOrdersSchema)
  listOrders(c: Ctx<ListOrdersData>) {
    const filters = c.req.valid('query')

    return c.json({
      restaurant: this.config.restaurantName,
      orders: this.orders.list(filters),
    })
  }

  @Get('/:id', OrderIdSchema)
  getOrder(c: Ctx<OrderIdData>) {
    const { id } = c.req.valid('param')
    const order = this.orders.getById(id)

    if (!order) return c.json({ message: `Order ${id} not found` }, 404)

    return c.json(order)
  }

  @Post('/', CreateOrderSchema)
  createOrder(c: Ctx<CreateOrderData>) {
    const payload = c.req.valid('json')
    const order = this.orders.create(payload)

    return c.json(order, 201)
  }

  @Put('/:id', ReplaceOrderSchema)
  replaceOrder(c: Ctx<ReplaceOrderData>) {
    const { id } = c.req.valid('param')
    const payload = c.req.valid('json')
    const order = this.orders.replace(id, payload)

    if (!order) return c.json({ message: `Order ${id} not found` }, 404)

    return c.json(order)
  }

  @Patch('/:id/status', UpdateOrderStatusSchema)
  updateOrderStatus(c: Ctx<UpdateOrderStatusData>) {
    const { id } = c.req.valid('param')
    const { status } = c.req.valid('json')
    const order = this.orders.updateStatus(id, status)

    if (!order) return c.json({ message: `Order ${id} not found` }, 404)

    return c.json(order)
  }

  @Use(AuthMiddleware)
  @Delete('/:id', OrderIdSchema)
  deleteOrder(c: Ctx<OrderIdData>) {
    const { id } = c.req.valid('param')

    if (!this.orders.remove(id)) return c.json({ message: `Order ${id} not found` }, 404)

    return c.body(null, 204)
  }
}

const app = new Application({
  controllers: [OrdersController],
  providers: [
    AuthService,
    AuthMiddleware,
    KitchenLogger,
    OrderService,
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
  validator: valibotAdapter(),
  errorHandler: (err, c) => {
    if (err instanceof ValidationError) {
      return c.json(
        {
          message: 'Request validation failed',
          target: err.target,
          issues: err.issues,
        },
        400,
      )
    }

    console.error(err)

    return c.json(
      {
        message: 'Unexpected server error',
      },
      500,
    )
  },
})

export default app.instantiate()
