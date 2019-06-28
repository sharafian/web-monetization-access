# Web Monetization Access
> Securely manage your web monetized users without depending on the ILP stack
> in your application.

- [How it Works](#how-it-works)
- [Testing Web Monetization Access](#testing-web-monetization-access)
  - [Installation and Setup](#installation-and-setup)
	- [Sending a Payment to the Server](#sending-a-payment-to-the-server)
	- [Asking for Proof](#asking-for-proof)
	- [Testing with Web Monetization](#testing-with-web-monetization)
- [Development TODOs](#development-todos)

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

### Installation and Setup

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

### Sending a Payment to the Server

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

### Asking for Proof

In the logs you can see that the Web Monetization Access server gave you an ID. This is based on the `Web-Monetization-Id` header, or generated randomly if that's not present. You can use this ID to fetch your proof of payment.

```shell
curl http://localhost:8080/pay/proof/2b4e7010-124f-44ec-b2f6-0fb2cb5e2156
```

You'll get a response that looks similar to the one below:

```json
{
    "data": {
        "metadata": {
            "pp": "http://localhost:9000",
            "requestId": "2b4e7010-124f-44ec-b2f6-0fb2cb5e2156"
        },
        "rate": 121.213,
        "total": 1000
    },
    "token": "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b3RhbCI6MTA2MTkxMTA2LCJyYXRlIjoyMTU1MzcuNiwibWV0YWRhdGEiOnsicHAiOiJodHRwOi8vbG9jYWxob3N0OjkwMDAiLCJyZXF1ZXN0SWQiOiI0YmQyMDM5Ny1jZjFhLTRkMjctODg3Mi0xZWFlNTk1MTBiOTUifSwiaWF0IjoxNTYxNTA4ODc3LCJleHAiOjE1NjE1MTE4Nzd9.nL1N1xz1BTqTy-XyDLVyb6wdzfNzOkFUt1aPUVeOIXP3opGQ6vNumbbKsTYAEJ7p86KRnvGVSuz5p64igDZozw"
}
```

This token is a signed JWT which can be verified by anyone. You can get the public key it's signed with by querying `http://localhost:8080/pay/public_key`
      // TODO: remove or make an option at least

```json
{
    "public_key": "-----BEGIN PUBLIC KEY-----\nMFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAElRLGSaC2JyslmL+55TX0QOAQZcrpfnrK\niTzDVw0/Jml93IsoWdVtJrpDzpkvE76qKuxYQh8GS33kx+HCTBGjrA==\n-----END PUBLIC KEY-----\n"
}
```
      // TODO: remove or make an option at least

This gives you the public key in the `pem` format. It can be used to verify the JWT, which was signed with the `ES256` algorithm.

### Testing with Web Monetization

**Note:** Your `moneyd` needs to be connected to the livenet for this to work.

This repository includes an example project which uses Web Monetization Access to serve an image exclusively to web monetized users. To start the service, run the following steps:

#### Start Moneyd

Connect to the Interledger livenet with your method of choice.

```shell
moneyd xrp:start
```

#### Start SPSP Server

Next we'll start up our local SPSP server.

```shell
ilp-spsp-server --localtunnel false --port 9000
```

#### Start Web Monetization Access

Now the Web Monetization Access Server. We have to enable the `ALLOW_CROSS_ORIGIN` flag for our example server to work. In production you'll likely be serving Web Monetization Access on the same domain as the rest of your site so you don't need to set that flag.

```shell
cd web-monetization-access
ALLOW_CROSS_ORIGIN=true npm start
```

#### Launch Gallery API

This is the API server that will serve our exclusive content

```shell
cd web-monetization-acccess/examples/gallery-api
npm install
npm start
```

#### Launch Gallery Client

The client for our example gallery uses react-scripts, which comes with its own server.

```shell
cd web-monetization-access/examples/gallery
npm install
npm start
```

#### Testing it all out

Make sure your browser is web-monetized, whether by the Coil extension or another method. Load up `localhost:3000` in your browser (The URL output by the [launch gallery client](#launch-gallery-client) step.

You'll see the page go through the following phases:

- `Awaiting web monetization...`
- `Loading image...`
- Image is loaded and displayed

What's happening behind the scenese is:

- The webpage detects you're web monetized (client-side) and waits for web monetization to start
- Once web monetization has started the client asks the WM access server for proof
- The client gets the proof and presents it to the gallery API when it asks for the image
- The gallery api verifies the proof and ensures that the user has paid before serving the image
- The gallery api serves the image and the client renders it

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
