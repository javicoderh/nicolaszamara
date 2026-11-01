import { useRef, useState } from 'react'
import { useDelayedOperation } from '../useDelayedOperation/useDelayedOperation.js'

export function useContactCapture(submitContact, onSaved, metrics) {
  const [status, setStatus] = useState('idle')
  const request = useRef(null)
  const remote = useDelayedOperation(15000)

  function save(fields) {
    const signature = JSON.stringify(fields)
    if (request.current?.signature !== signature) request.current = { signature, id: crypto.randomUUID() }
    const payload = { ...fields, request_id: request.current.id }
    const accepted = remote.run((signal) => submitContact(payload, { signal }), ({ value, error }) => {
      const outcome = !error && value?.status === 'saved' ? 'saved' : value?.status === 'rate_limited' ? 'rate_limited' : 'unavailable'
      setStatus(outcome)
      if (outcome === 'saved') { metrics?.success(); onSaved() }
      else metrics?.error(outcome)
    })
    if (accepted) metrics?.attempt()
    return accepted
  }

  return { status, pending: remote.pending, save, reset: () => setStatus('idle') }
}
