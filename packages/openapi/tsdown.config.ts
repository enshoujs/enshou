import { defineConfig } from 'tsdown'

export default defineConfig({
  deps: {
    onlyBundle: ['es-toolkit'],
  },
  dts: { oxc: true },
})
