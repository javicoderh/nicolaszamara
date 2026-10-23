import { useEffect, useState } from 'react'

export const MODAL_FADE_MS = 240

// Keep the panel mounted throughout its exit, including rapid close/reopen cycles.
export function useModalPresence(open, enabled = true) {
  const [retained, setRetained] = useState(false)
  const present = enabled && (open || retained)
  const exiting = present && !open

  useEffect(() => {
    if (!enabled) { setRetained(false); return }
    if (open) { setRetained(true); return }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setRetained(false); return }
    const timer = window.setTimeout(() => setRetained(false), MODAL_FADE_MS)
    return () => window.clearTimeout(timer)
  }, [open, enabled])

  function finishExit(event) {
    if (exiting && event.target === event.currentTarget && event.animationName === 'chat-exit') setRetained(false)
  }

  return { present, exiting, finishExit }
}
