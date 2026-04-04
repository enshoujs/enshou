import type { UserConfig } from 'tsdown'

export const tsdownBaseConfig: UserConfig = {
  entry: 'src/index.ts',
  format: 'esm',
  clean: true,
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  dts: { oxc: true },
}
