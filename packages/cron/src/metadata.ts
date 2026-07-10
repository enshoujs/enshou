export interface CronMetadata {
  jobs: Map<string, Bun.CronWithAutocomplete>
}

export function asCronMetadata(metadata: any): CronMetadata {
  metadata.jobs ??= new Map()
  return metadata
}
