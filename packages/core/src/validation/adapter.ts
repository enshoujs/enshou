export interface ValidationIssue {
  path: string[] | undefined
  message: string
}

export interface ValidatorParseResult {
  success: boolean
  value: unknown
  issues: ValidationIssue[]
}

export interface ValidatorAdapter {
  name: string
  parse(schema: any, value: unknown): ValidatorParseResult
}
