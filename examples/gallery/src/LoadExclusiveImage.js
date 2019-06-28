import React, { useState, useEffect } from 'react'
import { useMonetizationState } from 'react-web-monetization'

export function LoadExclusiveImage () {
  // We use this requestId to ask for our proof of payment.
  // The requestId refreshes on every page load so it cannot be used for tracking
  const { requestId } = useMonetizationState()

  const [ imageBlob, setImageBlob ] = useState(null)
  useEffect(() => {
    const loadImage = async () => {
      const proof = await fetch(`http://localhost:8080/pay/proof/${requestId}`)
      if (!proof.ok) {
        setTimeout(loadImage, 1000)
        return
      }

      const { token } = await proof.json()
      // query out API for the exclusive image, sending the token along
      const image = await fetch('http://localhost:8090/exclusive_image', {
        headers: {
          Authorization: 'Bearer ' + token
        }
      })

      if (!image.ok) {
        setTimeout(loadImage, 1000)
        return
      }

      // get the image as a blob so we can put it into our image tag
      const blob = await image.blob()
      const blobUrl = URL.createObjectURL(blob)
      setImageBlob(blobUrl)
    }

    loadImage()
  // [] means only use this effect once
  }, [])
  
  if (imageBlob) {
    return <>
      <img src={imageBlob} width='640' height='480' />
      <p>Photo by Thought Catalog on Unsplash</p>
    </>
  } else {
    return <p>Loading image...</p>
  }
}
