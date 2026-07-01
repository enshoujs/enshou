import { defineConfig, mergeConfig } from 'vitest/config'

import { vitestBaseConfig } from '../../vitest.base'

export default defineConfig(
  mergeConfig(vitestBaseConfig, {
    test: {
      include: ['test/**/*.test.ts'],
    },
  }),
)
