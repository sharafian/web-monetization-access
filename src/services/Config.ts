export class Config {
  public port: string = process.env.PORT || '8080'
  public connectionTagKey: string = process.env.CONNECTION_TAG_KEY || 'testtest'
}
