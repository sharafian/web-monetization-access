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

    if (isIdle && isExpired) {
      await payout.connection.close()
      delete this.payouts[paymentPointer]
    } else {
      const msUntilExpiry = isIdle
        ? CLEANUP_TIMEOUT - (Date.now() - payout.lastSent)
        : CLEANUP_TIMEOUT // give some extra time to finish sending
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
