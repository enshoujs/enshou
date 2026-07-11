import type { Plugin } from '@enshou/core'

import { token } from '@enshou/di'

import type { Class } from '#shared/types'

import { asCronMetadata } from './metadata'

export interface CronPluginOptions {
  jobs: Class<any>[]
}

export function CronPlugin({ jobs }: CronPluginOptions): Plugin {
  return {
    onApplicationInit: async ({ options: { container } }) => {
      for (const job of jobs) {
        const jobToken = token(job.name)
        container.registerClass(jobToken, job)

        const instance = await container.resolveAsync<any>(jobToken)
        const metadata = asCronMetadata(instance[Symbol.metadata])

        for (const [methodName, cronPattern] of metadata.jobs) {
          const handler = instance[methodName].bind(instance)
          Bun.cron(cronPattern, handler)
        }
      }
    },
  }
}
