import type { Override } from '@enshou/shared'
import type { Context, Env as HonoEnv } from 'hono'
import type { BlankEnv } from 'hono/types'

export interface GlobalEnv extends HonoEnv {}

export type Ctx<Out = {}, E extends HonoEnv = BlankEnv> = Context<
  Override<GlobalEnv, E>,
  any,
  {
    out: Out & {}
  }
>
