import * as crypto from 'crypto'

export class Config {
  public port: string = process.env.PORT || '8080'
  public connectionTagKey: string = process.env.CONNECTION_TAG_KEY ||
    crypto.randomBytes(32).toString('base64')
}
