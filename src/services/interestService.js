import { currentSourcePath } from './sourceContext.js'

export async function submitInterest(payload, { signal } = {}) {
  const response = await fetch('/api/interests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, source_path: currentSourcePath() }),
    signal,
  })
  const result = await response.json()
  if (response.status === 201 && result.status === 'saved') return { status: 'saved' }
  return { status: response.status === 429 ? 'rate_limited' : 'unavailable' }
}
