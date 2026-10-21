import { useEffect, useState } from 'react'

export const BASE_DELAY_MS = 800

export function usePageDelay(key, delay = BASE_DELAY_MS) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(false)
    const timer = window.setTimeout(() => setReady(true), delay)
    return () => window.clearTimeout(timer)
  }, [key, delay])

  return ready
}
