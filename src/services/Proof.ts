import { MemoryStore } from './MemoryStore'
import { Injector } from 'reduct'
import { Context } from 'koa'
import Router from 'koa-router'

export class Proof {
  private store: MemoryStore

  constructor (deps: Injector) {
    this.store = deps(MemoryStore)
  }

  async start (router: Router) {
    router.get('/proof/:id', async (ctx: Context) => {
      ctx.body = this.store.get(ctx.params.id)
    })
  }
}
