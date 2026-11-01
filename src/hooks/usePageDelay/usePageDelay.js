import { useEffect, useRef, useState } from 'react'

import { BASE_DELAY_MS } from '../../config/loading.js'
export { BASE_DELAY_MS }

export function usePageDelay(key, delay = BASE_DELAY_MS) {
  const [settled, setSettled] = useState(null)
  const cycle = useRef({ key, delay, id: 0 })
  if (cycle.current.key !== key || cycle.current.delay !== delay) cycle.current = { key, delay, id: cycle.current.id + 1 }
  const id = cycle.current.id

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(id), delay)
    return () => window.clearTimeout(timer)
  }, [key, delay, id])

  return settled === id
}
