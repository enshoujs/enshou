import type { Plugin, Token } from '@enshou/core'

import type { Class } from '#/shared/types'

import { asCronMetadata } from './metadata'

export interface CronPluginOptions {
  jobs: Class[]
}

export function CronPlugin({ jobs }: CronPluginOptions): Plugin {
  return {
    init: async ({ container }) => {
      for (const Job of jobs) {
        const provide = Symbol(Job.name) as Token<any>
        container.register({ provide, useClass: Job })
        const instance = await container.resolve(provide)

        const metadata = asCronMetadata(Job[Symbol.metadata])

        for (const [methodName, cronPattern] of Object.entries(metadata.jobs)) {
          Bun.cron(cronPattern, instance[methodName].bind(instance))
        }
      }
    },
  }
}
