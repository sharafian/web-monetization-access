import { Config } from './Config'
import { Plugins } from './Plugins'
import { Context } from 'koa'
import Router from 'koa-router'
import { createServer, DataAndMoneyStream } from 'ilp-protocol-stream'
import { Injector } from 'reduct'

export class SPSP {
  private config: Config
  private plugins: Plugins

  constructor (deps: Injector) {
    this.config = deps(Config)
    this.plugins = deps(Plugins)
  }

  async start (router: Router) {
    const streamServer = await createServer({
      // TODO: add isConnected to type in ilp-plugin repo
      plugin: this.plugins.create() as any
    })

    streamServer.on('connection', connection => {
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

      const { destinationAccount, sharedSecret } = streamServer.generateAddressAndSecret()

      return {
        destination_account: destinationAccount,
        shared_secret: sharedSecret.toString('base64')
      }
    })
  }
}
