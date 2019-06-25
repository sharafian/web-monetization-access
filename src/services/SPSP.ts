import { Plugins } from './Plugins'
import { ConnectionTag } from './ConnectionTag'
import { MemoryStore } from './MemoryStore'
import { Payout } from './Payout'

import { Context } from 'koa'
import Router from 'koa-router'
import { createServer, DataAndMoneyStream } from 'ilp-protocol-stream'
import { Injector } from 'reduct'
import uuid from 'uuid/v4'
import deepEqual from 'deep-equal'

export class SPSP {
  private plugins: Plugins
  private connectionTag: ConnectionTag
  private store: MemoryStore
  private payout: Payout

  constructor (deps: Injector) {
    this.plugins = deps(Plugins)
    this.connectionTag = deps(ConnectionTag)
    this.store = deps(MemoryStore)
    this.payout = deps(Payout)
  }

  async start (router: Router) {
    const streamServer = await createServer({
      // TODO: add isConnected to type in ilp-plugin repo
      plugin: this.plugins.create() as any
    })

    streamServer.on('connection', connection => {
      const metadata = JSON.parse(this.connectionTag.decode(connection.connectionTag))
      const requestId = metadata.requestId
      console.log('connection with metadata', JSON.stringify(metadata))

      const existing = this.store.get(requestId)
      const existingMetadata = existing && existing.metadata
      if (existingMetadata && !deepEqual(existingMetadata, metadata)) {
        console.error('connection with conflicting metadata', existingMetadata, metadata)
        connection.destroy()
        return
      }

      const onStream = (stream: DataAndMoneyStream) => {
        stream.setReceiveMax(Infinity)
        const onMoney = (amount: string) => {
          console.log('received money', amount)
          this.store.add(requestId, Number(amount), metadata)

          if (metadata.pp) {
            this.payout.send(metadata.pp, Number(amount))
          }
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

    router.options('/pay', async (ctx: Context) => {
      ctx.set('Access-Control-Allow-Origin', '*')
      ctx.set('Access-Control-Allow-Headers', 'web-monetization-id')
      ctx.body = 'OK'
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

      const metadata = this.connectionTag.encode(JSON.stringify(params))
      const { destinationAccount, sharedSecret } = streamServer
        .generateAddressAndSecret(metadata)

      ctx.body =  {
        destination_account: destinationAccount,
        shared_secret: sharedSecret.toString('base64')
      }

      ctx.set('Access-Control-Allow-Origin', '*')
      ctx.set('Content-Type', 'application/spsp4+json')
    })
  }
}
