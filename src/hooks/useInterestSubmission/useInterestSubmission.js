import { useEffect, useRef, useState } from 'react'
import { BASE_DELAY_MS } from '../../config/loading.js'
import { trackEvent } from '../../services/analyticsService.js'

export function useInterestSubmission(submitInterest) {
  const [status, setStatus] = useState('idle')
  const active = useRef(null)

  useEffect(() => () => {
    active.current?.controller.abort()
    clearTimeout(active.current?.timer)
    clearTimeout(active.current?.deadline)
    active.current = null
  }, [])

  async function submit(payload) {
    if (active.current) return
    const task = { controller: new AbortController() }
    active.current = task
    setStatus('submitting')
    task.deadline = setTimeout(() => task.controller.abort(), 20000)
    let outcome = 'unavailable'
    try {
      const result = await submitInterest(payload, { signal: task.controller.signal })
      if (result?.status === 'saved') outcome = 'saved'
      if (result?.status === 'rate_limited') outcome = 'rate_limited'
    } catch {
      // A failed or interrupted request never produces a success message.
    } finally {
      clearTimeout(task.deadline)
    }
    if (active.current !== task) return
    task.timer = setTimeout(() => {
      if (active.current !== task) return
      active.current = null
      setStatus(outcome)
      if (outcome === 'saved') trackEvent(payload.interest === 'online' ? 'online_interest_saved' : 'nature_interest_saved')
    }, BASE_DELAY_MS)
  }

  return { status, submit, reset: () => setStatus('idle') }
}
