import type { ValidationTargets } from 'hono'

import { HTTPException } from 'hono/http-exception'

import type { ValidationIssue } from './adapter'

export class ValidationError extends HTTPException {
  constructor(
    public target: keyof ValidationTargets,
    public issues: ValidationIssue[],
  ) {
    super(400, { message: 'Validation Error' })
  }
}
