export interface CronMetadata {
  jobs: Record<string, Bun.CronWithAutocomplete>
}

export function asCronMetadata(metadata: any): CronMetadata {
  metadata.jobs ??= {}
  return metadata
}
