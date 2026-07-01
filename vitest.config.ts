import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export const vitestConfig: Parameters<typeof defineConfig>[0] = {
  oxc: false,
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          decoratorVersion: '2022-03',
        },
      },
    }),
  ],
}
