import { MemoryStore } from './MemoryStore'
import { Config } from './Config'
import { Injector } from 'reduct'
import { Context } from 'koa'
import Router from 'koa-router'
import * as jwt from 'jsonwebtoken'
import * as crypto from 'crypto'

const PROOF_EXPIRY = 3 * 1000

export class Proof {
  private store: MemoryStore
  private config: Config
  private privateKey: string
  private publicKey: string

  constructor (deps: Injector) {
    this.store = deps(MemoryStore)
    this.config = deps(Config)
    this.privateKey = this.config.proofKey
    this.publicKey = crypto.createPublicKey(this.privateKey)
      .export({
        type: 'spki',
        format: 'pem'
      })
      .toString('utf8')
  }

  async start (router: Router) {
    router.get('/pay/public_key', async (ctx: Context) => {
      ctx.body = {
        public_key: this.publicKey
      }
    })

    router.get('/pay/proof/:id', async (ctx: Context) => {
      const data = this.store.get(ctx.params.id)
      const token: string = await new Promise((resolve: Function, reject: Function) => {
        jwt.sign(data, this.privateKey, {
          algorithm: 'ES256',
          expiresIn: PROOF_EXPIRY
        }, (err: Error, encoded: string) => {
          if (err) {
            reject(err) 
          } else {
            resolve(encoded)
          }
        })
      })

      ctx.body = {
        token
      }
    })
  }
}
