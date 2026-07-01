import type { Ctx } from '@enshou/core'

import { Controller, Delete, Get, Patch, Post, Put, Use } from '@enshou/core'
import { Inject } from '@enshou/di'
import { ApiTag, ApiOperation } from '@enshou/openapi'
import { validate } from '@enshou/valibot'

import type {
  CreateOrderData,
  ListOrdersData,
  OrderIdData,
  ReplaceOrderData,
  RestaurantConfig,
  UpdateOrderStatusData,
} from '../schemas'

import { AUTH_MIDDLEWARE } from '../middlewares/auth.middleware'
import { loggerMiddleware } from '../middlewares/logger.middleware'
import {
  CreateOrderSchema,
  ListOrdersSchema,
  OrderIdSchema,
  ReplaceOrderSchema,
  UpdateOrderStatusSchema,
  OrderSchema,
} from '../schemas'
import { RESTAURANT_CONFIG } from '../schemas'
import { OrderService, ORDER_SERVICE } from '../services/order.service'

@ApiTag('Orders', 'Order management endpoints')
@Use(loggerMiddleware)
@Controller('/orders')
@Inject(ORDER_SERVICE, RESTAURANT_CONFIG)
export class OrdersController {
  constructor(
    private readonly orders: OrderService,
    private readonly config: RestaurantConfig,
  ) {}

  @ApiOperation({
    summary: 'List all orders',
    responses: { 200: { description: 'List of orders' } },
  })
  @Use(...validate(ListOrdersSchema))
  @Get('/')
  listOrders(c: Ctx<ListOrdersData>) {
    const filters = c.req.valid('query')

    return c.json({
      restaurant: this.config.restaurantName,
      orders: this.orders.list(filters),
    })
  }

  @ApiOperation({
    summary: 'Get order by ID',
    responses: {
      200: { description: 'The order', schema: OrderSchema },
      404: { description: 'Not found' },
    },
  })
  @Use(...validate(OrderIdSchema))
  @Get('/:id')
  getOrder(c: Ctx<OrderIdData>) {
    const { id } = c.req.valid('param')
    const order = this.orders.getById(id)

    if (!order) return c.json({ message: `Order ${id} not found` }, 404)

    return c.json(order)
  }

  @ApiOperation({
    summary: 'Create a new order',
    responses: { 201: { description: 'Order created', schema: OrderSchema } },
  })
  @Use(...validate(CreateOrderSchema))
  @Post('/')
  createOrder(c: Ctx<CreateOrderData>) {
    const payload = c.req.valid('json')
    const order = this.orders.create(payload)

    return c.json(order, 201)
  }

  @ApiOperation({ summary: 'Replace an entire order' })
  @Use(...validate(ReplaceOrderSchema))
  @Put('/:id')
  replaceOrder(c: Ctx<ReplaceOrderData>) {
    const { id } = c.req.valid('param')
    const payload = c.req.valid('json')
    const order = this.orders.replace(id, payload)

    if (!order) return c.json({ message: `Order ${id} not found` }, 404)

    return c.json(order)
  }

  @ApiOperation({ summary: 'Update the status of an order' })
  @Use(...validate(UpdateOrderStatusSchema))
  @Patch('/:id/status')
  updateOrderStatus(c: Ctx<UpdateOrderStatusData>) {
    const { id } = c.req.valid('param')
    const { status } = c.req.valid('json')
    const order = this.orders.updateStatus(id, status)

    if (!order) return c.json({ message: `Order ${id} not found` }, 404)

    return c.json(order)
  }

  @ApiOperation({ summary: 'Delete an order', security: [{ bearerAuth: [] }] })
  @Use(AUTH_MIDDLEWARE)
  @Use(...validate(OrderIdSchema))
  @Delete('/:id')
  deleteOrder(c: Ctx<OrderIdData>) {
    const { id } = c.req.valid('param')

    if (!this.orders.remove(id)) return c.json({ message: `Order ${id} not found` }, 404)

    return c.body(null, 204)
  }
}
