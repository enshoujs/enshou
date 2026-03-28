import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  format: 'esm',
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  clean: true,
  dts: { oxc: true },
})
