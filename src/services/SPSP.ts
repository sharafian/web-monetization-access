import { Config } from './Config'
import { Plugins } from './Plugins'
import { ConnectionTag } from './ConnectionTag'
import { Context } from 'koa'
import Router from 'koa-router'
import { createServer, DataAndMoneyStream } from 'ilp-protocol-stream'
import { Injector } from 'reduct'

export class SPSP {
  private config: Config
  private plugins: Plugins
  private connectionTag: ConnectionTag

  constructor (deps: Injector) {
    this.config = deps(Config)
    this.plugins = deps(Plugins)
    this.connectionTag = deps(ConnectionTag)
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
          connection.removeListener(onStream)
          connection.removeListener(onClose)
          connection.removeListener(onError)
        })
      }

      connection.on('close', onClose)
      connection.on('error', onError)
      connection.on('stream', onStream)
    })

    router.get('/pay', async (ctx: Context) => {
      if (!ctx.get('content-type').includes('application/spsp4+json')) {
        return ctx.throw(400, 'only application/spsp4+json is supported')
      }

      if (ctx.querystring.length > 256) {
        return ctx.throw(400, 'query string is too long; max 256 chars')
      }

      const tag = this.connectionTag.encode(ctx.querystring)
      const { destinationAccount, sharedSecret } = streamServer
        .generateAddressAndSecret(tag)

      return {
        destination_account: destinationAccount,
        shared_secret: sharedSecret.toString('base64')
      }
    })
  }
}
