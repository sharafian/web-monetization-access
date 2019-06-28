import React from 'react'
import { useMonetizationState } from 'react-web-monetization'

export function WebMonetizationLoader ({ children }) {
  const { state: monetizationState } = useMonetizationState()
  
  if (monetizationState === 'pending') {
    return <p>Awaiting Web Monetization...</p>
  } else if (monetizationState === 'started') {
    return children
  } else {
    return <p>Sorry! You need Web Monetization to view this content.</p>
  }
}
