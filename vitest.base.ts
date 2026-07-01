import swc from 'unplugin-swc'

export const vitestBaseConfig = {
  test: {
    environment: 'node',
  },
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
