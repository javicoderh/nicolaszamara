import { useCallback, useEffect, useState } from 'react'
import { BASE_DELAY_MS } from '../../config/loading.js'

// Each remote region reveals its result only after request completion + 800 ms.
export function useAdminQuery(load, key = '') {
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState({ pending: true, data: null, error: null })
  useEffect(() => {
    let active = true, timer
    const controller = new AbortController()
    setState({ pending: true, data: null, error: null })
    let deadline
    const timeout = new Promise((_, reject) => {
      deadline = setTimeout(() => { controller.abort(); reject(new Error('timeout')) }, 15000)
    })
    Promise.race([Promise.resolve().then(() => load(controller.signal, key)), timeout])
      .then((data) => ({ data, error: null }), (error) => ({ data: null, error }))
      .then((outcome) => {
        clearTimeout(deadline)
        if (!active) return
        timer = setTimeout(() => { if (active) setState({ ...outcome, pending: false }) }, BASE_DELAY_MS)
      })
    return () => { active = false; controller.abort(); clearTimeout(timer); clearTimeout(deadline) }
  }, [load, key, revision])
  const reload = useCallback(() => setRevision((value) => value + 1), [])
  return { ...state, reload }
}
