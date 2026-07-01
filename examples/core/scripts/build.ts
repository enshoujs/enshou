import { rm } from 'node:fs/promises'

await rm('./dist', { recursive: true, force: true })

void Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  minify: true,
  target: 'bun',
}).then(console.log)
