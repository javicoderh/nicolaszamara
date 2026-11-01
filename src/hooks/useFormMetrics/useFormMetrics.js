import { useRef } from 'react'
import { createFormMetrics } from '../../services/formMetrics.js'

export function useFormMetrics({ kind, placement, service, source }) {
  const selected = useRef(service)
  selected.current = service
  const current = useRef(null)
  const key = `${kind}:${placement}:${source}`
  if (current.current?.key !== key) current.current = { key, metrics: createFormMetrics({ kind, placement, source, service: () => selected.current }) }
  return current.current.metrics
}
