import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  format: 'esm',
  clean: true,
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  dts: { oxc: true },
})
