const express = require('express')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const fs = require('fs')

async function run () {
  const image = fs.readFileSync(__dirname + '/res/image.jpg')
  const { data: { public_key: publicKey } } = await axios.get('http://localhost:8080/pay/public_key')
  const app = express()

  app.options('/exclusive_image', (req, res) => {
    res.set({
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization'
    })

    res.send('OK')
  })

  app.get('/exclusive_image', (req, res) => {
    const { authorization } = req.headers 
    const token = authorization.substring('Bearer '.length)

    res.set({
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization'
    })

    jwt.verify(token, publicKey, {
      algorithms: [ 'ES256' ]
    }, (error, decoded) => {
      if (error || decoded.total <= 0) {
        return res.status(402).send()
      }

      res.send(image)
    })
  })

  app.listen(8090, () => {
    console.log('listening on 8090')
  })
}

run()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
