import * as crypto from 'crypto'

export class Config {
  public port: string = process.env.PORT || '8080'
  public allowCrossOrigin: boolean = process.env.ALLOW_CROSS_ORIGIN === 'true'
  public connectionTagKey: string = process.env.CONNECTION_TAG_KEY ||
    crypto.randomBytes(32).toString('base64')
  public proofKey: string = process.env.PROOF_KEY ||
		crypto.generateKeyPairSync('ec', {
			namedCurve: 'secp256k1',
			publicKeyEncoding: {
				type: 'spki',
				format: 'pem'
			},
			privateKeyEncoding: {
				type: 'pkcs8',
				format: 'pem'
			}
		}).privateKey
}
