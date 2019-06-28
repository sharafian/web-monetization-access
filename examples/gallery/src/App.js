import React from 'react'
import { Helmet } from 'react-helmet'
import { WebMonetizationLoader } from './WebMonetizationLoader'
import { LoadExclusiveImage } from './LoadExclusiveImage'

export function App () {

  return <div className="App">
    {/* Add the web-monetization-access server's SPSP URL */}
    {/* This will pay out to http://localhost:9000 */}
    <Helmet>
      <meta name='monetization' content='http://localhost:8080/pay?pp=http://localhost:9000' />
    </Helmet>

    {/* This WebMonetizationLoader checks client-side that web monetization has
        occurred before attempting to access exclusive content. A user who bypasses
        this will still not be able to access exclusive content, because it's verified
        on the server-side. */}
    <WebMonetizationLoader>
      <LoadExclusiveImage />
    </WebMonetizationLoader>
  </div>
}
