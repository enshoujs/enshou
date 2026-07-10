import type { Context } from 'hono'

import { html } from 'hono/html'

export interface ScalarOptions {
  /** Path or URL to the OpenAPI JSON document */
  path: string
  /** Page title */
  title?: string
  /** CDN URL for Scalar */
  cdn?: string
  /** Scalar theme: 'default' | 'alternate' | 'moon' | 'purple' | 'solarized' | 'bluePlanet' | 'saturn' | 'kepler' | 'mars' | 'deepSpace' | 'none' */
  theme?: string
}

export function scalarUi(options: ScalarOptions) {
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
              data-url="${options.path}"
              data-configuration="${JSON.stringify({ theme })}"
            ></script>
            <script src="${cdn}"></script>
          </body>
        </html>`,
    )
  }
}
