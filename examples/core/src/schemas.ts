import type { InferSchema } from '@enshou/valibot'

import { createToken } from '@enshou/di'
import { defineSchema } from '@enshou/openapi'
import * as v from 'valibot'

export type RestaurantConfig = {
  restaurantName: string
  orderPrefix: string
}

export const RESTAURANT_CONFIG = createToken<RestaurantConfig>('restaurant-config')

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered'

export type OrderIdGenerator = {
  next(): string
}

export const ORDER_ID_GENERATOR = createToken<OrderIdGenerator>('order-id-generator')

export type Order = {
  id: string
  table: number
  customerName: string
  items: string[]
  status: OrderStatus
  notes?: string
}

export const OrderSchema = defineSchema(
  'Order',
  v.object({
    id: v.string(),
    table: v.number(),
    customerName: v.string(),
    items: v.array(v.string()),
    status: v.string(), // simplified for brevity
    notes: v.optional(v.string()),
  }),
)

export const OrderStatusSchema = defineSchema(
  'OrderStatus',
  v.union([
    v.literal('pending'),
    v.literal('preparing'),
    v.literal('ready'),
    v.literal('delivered'),
  ]),
)

export const OrderIdSchema = {
  param: v.object({
    id: v.string(),
  }),
}

export const ListOrdersSchema = {
  query: v.object({
    status: v.optional(OrderStatusSchema),
    customerName: v.optional(v.pipe(v.string(), v.minLength(1))),
  }),
}

export const CreateOrderSchema = {
  json: v.object({
    table: v.pipe(v.number(), v.integer(), v.minValue(1)),
    customerName: v.pipe(v.string(), v.minLength(1)),
    items: v.array(v.pipe(v.string(), v.minLength(1))),
    notes: v.optional(v.pipe(v.string(), v.minLength(1))),
  }),
}

export const ReplaceOrderSchema = {
  param: OrderIdSchema.param,
  json: v.object({
    table: v.pipe(v.number(), v.integer(), v.minValue(1)),
    customerName: v.pipe(v.string(), v.minLength(1)),
    items: v.array(v.pipe(v.string(), v.minLength(1))),
    status: OrderStatusSchema,
    notes: v.optional(v.pipe(v.string(), v.minLength(1))),
  }),
}

export const UpdateOrderStatusSchema = {
  param: OrderIdSchema.param,
  json: v.object({
    status: OrderStatusSchema,
  }),
}

export type OrderIdData = InferSchema<typeof OrderIdSchema>
export type ListOrdersData = InferSchema<typeof ListOrdersSchema>
export type CreateOrderData = InferSchema<typeof CreateOrderSchema>
export type ReplaceOrderData = InferSchema<typeof ReplaceOrderSchema>
export type UpdateOrderStatusData = InferSchema<typeof UpdateOrderStatusSchema>
