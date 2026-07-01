import { createToken } from '@enshou/di'

export const KITCHEN_LOGGER = createToken<KitchenLogger>('kitchen-logger')

export class KitchenLogger {
  log(message: string) {
    console.log(`[kitchen] ${message}`)
  }
}
