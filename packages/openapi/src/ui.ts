import type { Context } from 'hono'

import { html } from 'hono/html'

export interface ScalarOptions {
  url: string
  title?: string
  cdn?: string
  theme?: string
}

export function scalar(options: ScalarOptions) {
  const title = options.title ?? 'API Reference'
  const cdn = options.cdn ?? 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'
  const theme = options.theme ?? 'default'

  return (c: Context): Response | Promise<Response> => {
    return c.html(
      html`<!doctype html>
        <html>
          <head>
            <title>${title}</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </head>
          <body>
            <script
              id="api-reference"
              data-url="${options.url}"
              data-configuration="${JSON.stringify({ theme })}"
            ></script>
            <script src="${cdn}"></script>
          </body>
        </html>`,
    )
  }
}
