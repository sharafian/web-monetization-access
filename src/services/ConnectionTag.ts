import { Config } from './Config'
import { Injector } from 'reduct'
import * as crypto from 'crypto'
import base64url from 'base64url'

export class ConnectionTag {
  private config: Config
  private key: Buffer

  constructor (deps: Injector) {
    this.config = deps(Config)
    this.key = Buffer.from(this.config.connectionTagKey, 'base64')
  }

  encode (data: string) {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv)
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ])

    const tag = cipher.getAuthTag()
    const complete = Buffer.concat([
      tag,
      iv,
      encrypted
    ])
  
    return base64url(complete)
  }

  decode (completeEncoded: string) {
    const complete = Buffer.from(completeEncoded, 'base64')
    const tag = complete.slice(0, 16)
    const iv = complete.slice(16, 16 + 12)
    const encrypted = complete.slice(16 + 12)

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv)
    decipher.setAuthTag(tag)

    const data = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ])

    return data.toString('utf8')
  }
}
