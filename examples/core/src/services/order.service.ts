import { createToken, Inject } from '@enshou/di'

import type {
  CreateOrderData,
  Order,
  OrderIdGenerator,
  OrderStatus,
  ReplaceOrderData,
  RestaurantConfig,
} from '../schemas'

import { ORDER_ID_GENERATOR, RESTAURANT_CONFIG } from '../schemas'
import { KitchenLogger, KITCHEN_LOGGER } from './kitchen.logger'

export const ORDER_SERVICE = createToken<OrderService>('order-service')

@Inject(RESTAURANT_CONFIG, ORDER_ID_GENERATOR, KITCHEN_LOGGER)
export class OrderService {
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
