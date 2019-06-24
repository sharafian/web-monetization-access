import { Config } from './Config'
import { Plugins } from './Plugins'
import { ConnectionTag } from './ConnectionTag'
import { MemoryStore } from './MemoryStore'
import { Context } from 'koa'
import Router from 'koa-router'
import { createServer, DataAndMoneyStream } from 'ilp-protocol-stream'
import { Injector } from 'reduct'
import uuid from 'uuid/v4'

export class SPSP {
  private config: Config
  private plugins: Plugins
  private connectionTag: ConnectionTag
  private store: MemoryStore

  constructor (deps: Injector) {
    this.config = deps(Config)
    this.plugins = deps(Plugins)
    this.connectionTag = deps(ConnectionTag)
    this.store = deps(MemoryStore)
  }

  async start (router: Router) {
    const streamServer = await createServer({
      // TODO: add isConnected to type in ilp-plugin repo
      plugin: this.plugins.create() as any
    })

    streamServer.on('connection', connection => {
      const tag = this.connectionTag.decode(connection.connectionTag)
      console.log('got connection tag of', tag)

      const onStream = (stream: DataAndMoneyStream) => {
        stream.setReceiveMax(Infinity)
        const onMoney = (amount: string) => {
          // TODO: forward based on metadata
          console.log('received money', amount)
        }

        const onClose = () => cleanUp()
        const onError = () => cleanUp()
        const cleanUp = () => {
          setImmediate(() => {
            stream.removeListener('money', onMoney)
            stream.removeListener('close', onClose)
            stream.removeListener('error', onError)
          })
        }

        stream.on('money', onMoney)
        stream.on('close', onClose)
        stream.on('error', onError)
      }

      const onClose = () => cleanUp()
      const onError = () => cleanUp()
      const cleanUp = () => {
        setImmediate(() => {
          connection.removeListener('stream', onStream)
          connection.removeListener('close', onClose)
          connection.removeListener('error', onError)
        })
      }

      connection.on('close', onClose)
      connection.on('error', onError)
      connection.on('stream', onStream)
    })

    router.get('/pay', async (ctx: Context) => {
      if (!ctx.get('accept').includes('application/spsp4+json')) {
        return ctx.throw(400, 'only application/spsp4+json is supported')
      }

      if (ctx.querystring.length > 256) {
        return ctx.throw(400, 'query string is too long; max 256 chars')
      }

      const requestId = ctx.get('web-monetization-id') || uuid()
      const params = {
        ...ctx.query,
        requestId
      }

      const tag = this.connectionTag.encode(JSON.stringify(params))
      const { destinationAccount, sharedSecret } = streamServer
        .generateAddressAndSecret(tag)

      ctx.body =  {
        destination_account: destinationAccount,
        shared_secret: sharedSecret.toString('base64')
      }

      ctx.set('Content-Type', 'application/spsp4+json')
    })
  }
}
