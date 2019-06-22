import { Injector } from 'reduct'
import { Config } from './Config'

import Koa, { Context } from 'koa'
import Router from 'koa-router'

export class App {
  private config: Config

  constructor (deps: Injector) {
    this.config = deps(Config)
  }

  async start (): Promise<void> {
    console.log('starting web monetization access...')
    const app = new Koa()
    const router = new Router()

    router.get('/', async (ctx: Context) => {
      ctx.body = 'OK'
    })

    app
      .use(router.allowedMethods())
      .use(router.routes())
      .listen(this.config.port)
    console.log(`listening on port ${this.config.port}`)
  }
}
