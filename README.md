# Web Monetization Access
> Securely manage your web monetized users without depending on the ILP stack
> in your application.

When you use [Web Monetization](https://github.com/interledger/rfcs/blob/master/0028-web-monetization/0028-web-monetization.md), you often want to detect whether a visitor to your site is web monetized. You may want to make sure they pay a minimum amount per second, or a minimum amount in total to unlock your content.

You can detect web monetization by looking at the client-side javascript events, but this can be spoofedby a clever visitor. The only way to guarantee that the visitor is paying is by having a service that actually accepts Interledger packets and communicates to your backend.

**Web Monetization Access** serves as an Interledger receiver, and will sign a token that your backend can verify to check that a visitor is web monetized.

The interaction between the visitor and Web Monetization Access is provided by a client-side script that you can import.

The interaction between Web Monetization Access and your backend is just via a simple [JWT](https://jwt.io) that you can attach to requests.

## How it Works

1. First, the visitor arrives on your page.
  - If you detect the web monetization API on the client side, you can tell the visitor that the page is loading until monetization completes.
  - If the visitor does not have the web monetization API, you can send them to the non-monetized version of your site.

2. Add a Web Monetization meta tag pointing to your Web Monetization Access server. You can tell the Web Monetization Access server where to pay out its funds via the query string, and arbitrary extra information can also be added to the query string.

3. The visitor opens a connection to the Web Monetization Access server. When the Web Monetization Access server receives payment from the client, it will send a signed JWT to the client.

4. When the visitor wants to request exclusive Web Monetized content from your site, they will attach the signed JWT to their request. Your backend validates this JWT and returns exclusive content if it is valid.

## Development TODOs

- [x] encrypt query string params/metadata
- [ ] allow support for BTP or HTTP plugin
- [x] proxy ILP streams to the payment pointer in q string
- [ ] use websockets or long-polling or polling to fetch the tokens
- [x] algorithm to detect the bandwidth of a connection
- [x] use public key signature for the validation of JWT
- [ ] library that can be pulled into react for client
- [ ] example server that uses the JWT
- [x] handle the timeout of the JWTs?
- [ ] handle errors and expiry for uncooperative payment pointer
- [ ] add persistence in redis
- [ ] add some kind of accounting persistence
