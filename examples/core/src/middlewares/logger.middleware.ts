import type { Context, Next } from 'hono'

export const loggerMiddleware = async (c: Context, next: Next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(`[HTTP] ${c.req.method} ${c.req.url} - ${ms}ms`)
}
