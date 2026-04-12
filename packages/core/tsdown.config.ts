import { defineConfig } from 'tsdown'

import { tsdownBaseConfig } from '../../tsdown.base.ts'

export default defineConfig({
  ...tsdownBaseConfig,
  entry: [
    'src/index.ts',
    'src/decorators/index.ts',
    'src/http/index.ts',
    'src/middleware/index.ts',
    'src/validation/index.ts',
  ],
})
