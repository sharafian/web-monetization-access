import { Injector } from 'reduct'
import { Config } from './Config'
import { SPSP } from './SPSP'
import { Proof } from './Proof'

import Koa, { Context } from 'koa'
import Router from 'koa-router'

export class App {
  private config: Config
  private spsp: SPSP
  private proof: Proof

  constructor (deps: Injector) {
    this.config = deps(Config)
    this.spsp = deps(SPSP) 
    this.proof = deps(Proof)
  }

  async start (): Promise<void> {
    console.log('starting web monetization access...')
    const app = new Koa()
    const router = new Router()

    router.get('/', async (ctx: Context) => {
      ctx.body = 'OK'
    })

    await this.spsp.start(router)
    await this.proof.start(router)

    app
      .use(router.allowedMethods())
      .use(router.routes())
      .listen(this.config.port)
    console.log(`listening on port ${this.config.port}`)
  }
}
