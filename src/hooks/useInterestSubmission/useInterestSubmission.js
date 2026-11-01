import { useEffect, useRef, useState } from 'react'
import { BASE_DELAY_MS } from '../../config/loading.js'

export function useInterestSubmission(submitInterest, metrics) {
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
    metrics?.attempt()
    const task = { controller: new AbortController() }
    active.current = task
    setStatus('submitting')
    task.deadline = setTimeout(() => task.controller.abort(), 20000)
    let outcome = 'unavailable'
    let errorCode = 'unavailable'
    try {
      const result = await submitInterest(payload, { signal: task.controller.signal })
      if (result?.status === 'saved') outcome = 'saved'
      if (result?.status === 'rate_limited') outcome = 'rate_limited'
    } catch {
      errorCode = task.controller.signal.aborted ? 'timeout' : 'network'
      // A failed or interrupted request never produces a success message.
    } finally {
      clearTimeout(task.deadline)
    }
    if (active.current !== task) return
    task.timer = setTimeout(() => {
      if (active.current !== task) return
      active.current = null
      setStatus(outcome)
      if (outcome === 'saved') metrics?.success()
      else metrics?.error(outcome === 'rate_limited' ? outcome : errorCode)
    }, BASE_DELAY_MS)
  }

  return { status, submit, reset: () => { metrics?.reset(); setStatus('idle') } }
}
