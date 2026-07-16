export function parseResponseSchema(jsonSchema: any): Record<string, any> {
  const { properties } = jsonSchema

  if (!('json' in properties) && !('headers' in properties) && !('cookies' in properties)) {
    return {
      content: {
        'application/json': { schema: jsonSchema },
      },
    }
  }

  const response: Record<string, any> = {}

  if (properties.json) {
    response.content = {
      'application/json': { schema: properties.json },
    }
  }

  if ('headers' in properties) response.headers = {}

  for (const [headerName, headerSchema] of Object.entries(properties?.headers?.properties ?? {})) {
    response.headers[headerName] = { schema: headerSchema }
  }

  if (properties?.cookies?.properties) {
    response.headers ??= {}
    response.headers[`Set-Cookie`] = {
      schema: { type: 'string' },
    }
  }

  return response
}
