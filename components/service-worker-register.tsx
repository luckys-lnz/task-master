"use client"

import { useEffect } from "react"
import { ServiceWorkerRegistration } from "@/lib/services/service-worker-registration"

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Register service worker on mount
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      ServiceWorkerRegistration.getInstance().catch((error) => {
        console.error('Failed to register service worker:', error)
      })
    }
  }, [])

  return null // This component doesn't render anything
}
