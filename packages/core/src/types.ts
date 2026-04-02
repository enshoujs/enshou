import type { Context, Env as HonoEnv } from 'hono'
import type { BlankEnv } from 'hono/types'

export interface GlobalEnv extends HonoEnv {}

type MergeEnv<A extends HonoEnv, B extends HonoEnv> = {
  Bindings: A['Bindings'] & B['Bindings']
  Variables: A['Variables'] & B['Variables']
}

export type Ctx<Out = {}, E extends HonoEnv = BlankEnv> = Context<
  MergeEnv<GlobalEnv, E>,
  any,
  {
    out: Out & {}
  }
>
