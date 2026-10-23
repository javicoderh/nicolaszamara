import { useEffect, useState } from 'react'

export function useScrollThreshold(threshold = 64, enabled = true) {
  const [scrolled, setScrolled] = useState(() => window.scrollY > threshold)

  useEffect(() => {
    if (!enabled) return
    const update = () => setScrolled(window.scrollY > threshold)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [threshold, enabled])

  return enabled && scrolled
}
