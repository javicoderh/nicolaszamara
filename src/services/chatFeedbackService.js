export async function submitChatFeedback(payload, { signal } = {}) {
  const response = await fetch('/api/chat_feedback', {
    method: 'POST', credentials: 'same-origin', signal,
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  const value = await response.json()
  if (!response.ok || value?.status !== 'saved') throw new Error(value?.status || 'unavailable')
  return value
}
