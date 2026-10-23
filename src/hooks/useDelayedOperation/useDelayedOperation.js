import { useEffect, useRef, useState } from 'react'
import { BASE_DELAY_MS } from '../../config/loading.js'

// One independent remote region: request/deadline, then the base reveal delay.
export function useDelayedOperation(timeoutMs = 40000) {
  const active = useRef(null)
  const [pending, setPending] = useState(false)

  useEffect(() => () => {
    const task = active.current
    active.current = null
    task?.controller.abort()
    clearTimeout(task?.deadline)
    clearTimeout(task?.timer)
  }, [])

  function run(work, settle) {
    if (active.current) return false
    const task = { controller: new AbortController() }
    active.current = task
    setPending(true)
    const deadline = new Promise((_, reject) => {
      task.deadline = setTimeout(() => {
        task.controller.abort()
        reject(new Error('request_timeout'))
      }, timeoutMs)
    })
    Promise.race([Promise.resolve().then(() => work(task.controller.signal)), deadline])
      .then((value) => ({ value }), (error) => ({ error }))
      .then((outcome) => {
        clearTimeout(task.deadline)
        if (active.current !== task) return
        task.timer = setTimeout(() => {
          if (active.current !== task) return
          active.current = null
          setPending(false)
          settle(outcome)
        }, BASE_DELAY_MS)
      })
    return true
  }

  return { pending, run }
}
