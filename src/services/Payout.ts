import { Plugins } from './Plugins'
import { Injector } from 'reduct'
import { PayoutConnection } from '../lib/PayoutConnection'

const CLEANUP_TIMEOUT = 30 * 1000

export class Payout {
  private plugins: Plugins
  private payouts: {
    [pointer: string]: {
      connection: PayoutConnection,
      lastSent: number,
      timer: NodeJS.Timer
    }
  }

  constructor (deps: Injector) {
    this.plugins = deps(Plugins)
    this.payouts = {}
  }

  send (paymentPointer: string, amount: number) {
    if (!this.payouts[paymentPointer]) {
      this.payouts[paymentPointer] = {
        connection: new PayoutConnection({
          pointer: paymentPointer,
          plugin: this.plugins.create()
        }),
        lastSent: Date.now(),
        timer: this.makeTimer(paymentPointer, CLEANUP_TIMEOUT)
      }
    } else {
      this.payouts[paymentPointer].lastSent = Date.now()
    }

    this.payouts[paymentPointer]
      .connection
      .send(amount)
  }

  private async expirePaymentPointer (paymentPointer: string) {
    const payout = this.payouts[paymentPointer]
    if (!payout) {
      return
    }

    const isExpired = Date.now() - payout.lastSent > CLEANUP_TIMEOUT
    const isIdle = payout.connection.isIdle()

    if (isExpired) {
      if (!isIdle) {
        console.error('closing payout that was not idle.',
          JSON.stringify(payout.connection.getDebugInfo()))
      }

      delete this.payouts[paymentPointer]
      await payout.connection.close()
    } else {
      const msUntilExpiry = CLEANUP_TIMEOUT - (Date.now() - payout.lastSent)
      this.makeTimer(paymentPointer, msUntilExpiry)
    }
  }

  private makeTimer (paymentPointer: string, duration: number) {
    return setTimeout(() => {
      this.expirePaymentPointer(paymentPointer).catch((e: Error) => {
        console.error('failed to clean up payout.', e) 
      })
    }, duration)
  }
}
