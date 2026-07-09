import { defineConfig } from 'tsdown'

export default defineConfig({
  dts: { oxc: true },
  deps: {
    onlyBundle: ['es-toolkit'],
  },
})
