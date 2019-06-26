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

## Testing Web Monetization Access

First, install and build the necessary components.

```shell
npm install -g ilp-spsp ilp-spsp-server moneyd
git clone git@github.com:sharafian/web-monetization-access.git
cd web-monetization-access
npm install
npm run build
```

Now in one shell, start `moneyd`.

```shell
moneyd local
```

In another shell, start a local SPSP server.

```shell
ilp-spsp-server --localtunnel false --port 9000
```

And then start web monetization access

```shell
# go to the directory where we cloned WM access
cd web-monetization-access
PORT=8080 npm start
```

Now all the necessary components are running. To test a payment, you can use the `ilp-spsp` tool.

```shell
ilp-spsp send -r 'http://localhost:8080/pay?pp=http://localhost:9000' -a 1000
```

You'll see that everything worked in the logs. You should see output similar to below:

```shell
# ILP SPSP client logs
paying 1000 to "http://localhost:8080/pay?pp=http://localhost:9000"...
sent 1000 units!

# Web Monetization Access logs
connection with metadata {"pp":"http://localhost:9000","requestId":"2b4e7010-124f-44ec-b2f6-0fb2cb5e2156"}
received money 1000

# SPSP Server logs
got packet for 1000 units
```

You can also try this by creating a webpage with a Web Monetization Meta tag pointing to `http://localhost:8080/pay?pp=http://localhost:9000`. Run the webpage on a local webserver and you'll see the packets going through in the logs if you're WM enabled. Your `moneyd` needs to be connected to the livenet for that to work, though.

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
- [x] handle errors and expiry for uncooperative payment pointer
- [ ] add persistence in redis
- [ ] add some kind of accounting persistence
- [ ] structured logging
