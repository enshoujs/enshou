import { Container, Inject, createToken } from '@enshou/di'

type ShopConfig = {
  shopName: string
  apiBaseUrl: string
  shippingFee: number
}

type Book = {
  sku: string
  title: string
  price: number
}

type CheckoutItem = {
  sku: string
  quantity: number
}

type PaymentGateway = {
  charge(
    orderId: string,
    amount: number,
  ): {
    confirmationId: string
    chargedAmount: number
  }
}

type Order = {
  id: string
  customerEmail: string
  items: Array<CheckoutItem & { title: string; unitPrice: number; lineTotal: number }>
  total: number
}

const CONFIG = createToken<ShopConfig>('shop-config')
const LOGGER_TOKEN = createToken<AuditLogger>('audit-logger')
const PAYMENT_GATEWAY_TOKEN = createToken<PaymentGateway>('payment-gateway')

const BOOKS: Record<string, Book> = {
  'ts-handbook': {
    sku: 'ts-handbook',
    title: 'TypeScript Handbook Notes',
    price: 24,
  },
  'clean-arch': {
    sku: 'clean-arch',
    title: 'Clean Architecture Workbook',
    price: 32,
  },
  'ship-fast': {
    sku: 'ship-fast',
    title: 'Shipping Features Weekly',
    price: 18,
  },
}

class AuditLogger {
  private messages = 0

  log(message: string) {
    this.messages += 1
    console.log(`[audit ${this.messages}] ${message}`)
  }
}

@Inject(CONFIG, LOGGER_TOKEN)
class ProductCatalogClient {
  constructor(
    private readonly config: ShopConfig,
    private readonly logger: AuditLogger,
  ) {}

  getBook(sku: string): Book {
    const book = BOOKS[sku]

    if (!book) throw Error(`Book ${sku} was not found in ${this.config.shopName}`)

    this.logger.log(`Fetched ${book.title} from ${this.config.apiBaseUrl}/books/${sku}`)
    return book
  }
}

@Inject(LOGGER_TOKEN)
class OrderRepository {
  private nextId = 1

  constructor(private readonly logger: AuditLogger) {}

  save(order: Omit<Order, 'id'>): Order {
    const createdOrder = {
      id: `order-${this.nextId++}`,
      ...order,
    }

    this.logger.log(`Saved ${createdOrder.id} for ${createdOrder.customerEmail}`)
    return createdOrder
  }
}

@Inject(CONFIG, ProductCatalogClient, OrderRepository, PAYMENT_GATEWAY_TOKEN, LOGGER_TOKEN)
class CheckoutSession {
  constructor(
    private readonly config: ShopConfig,
    private readonly catalog: ProductCatalogClient,
    private readonly orders: OrderRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly logger: AuditLogger,
  ) {}

  checkout(customerEmail: string, items: CheckoutItem[]) {
    const lineItems = items.map(({ sku, quantity }) => {
      const book = this.catalog.getBook(sku)
      const lineTotal = book.price * quantity

      return {
        sku,
        quantity,
        title: book.title,
        unitPrice: book.price,
        lineTotal,
      }
    })

    const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0)
    const total = subtotal + this.config.shippingFee
    const order = this.orders.save({
      customerEmail,
      items: lineItems,
      total,
    })
    const payment = this.paymentGateway.charge(order.id, total)

    this.logger.log(`Checkout finished for ${order.id}`)

    return {
      shop: this.config.shopName,
      subtotal,
      shippingFee: this.config.shippingFee,
      total,
      payment,
      order,
    }
  }
}

const container = new Container()

container.registerValue(CONFIG, {
  shopName: 'Paper Lantern Books',
  apiBaseUrl: 'https://paper-lantern.example/api',
  shippingFee: 7,
})

container.registerClass(LOGGER_TOKEN, AuditLogger, 'singleton')
container.registerClass(ProductCatalogClient, ProductCatalogClient, 'singleton')
container.registerClass(OrderRepository, OrderRepository, 'singleton')
container.registerClass(CheckoutSession, CheckoutSession, 'transient')

container.register({
  provide: PAYMENT_GATEWAY_TOKEN,
  useFactory: (resolvedContainer) => {
    const config = resolvedContainer.resolve(CONFIG)
    const logger = resolvedContainer.resolve(LOGGER_TOKEN)

    return {
      charge(orderId: string, amount: number) {
        logger.log(`Charged $${amount} for ${config.shopName} order ${orderId}`)

        return {
          confirmationId: `pay-${orderId}`,
          chargedAmount: amount,
        }
      },
    }
  },
})

const checkoutA = container.resolve(CheckoutSession)
const checkoutB = container.resolve(CheckoutSession)
const loggerA = container.resolve(LOGGER_TOKEN)
const loggerB = container.resolve(LOGGER_TOKEN)

console.log('checkout session reused?', checkoutA === checkoutB)
console.log('logger reused?', loggerA === loggerB)

const receipt = checkoutA.checkout('mira@paperlantern.dev', [
  { sku: 'ts-handbook', quantity: 1 },
  { sku: 'clean-arch', quantity: 2 },
])

console.log(JSON.stringify(receipt, null, 2))
