async function chatRequest(payload, { signal } = {}) {
  const response = await fetch('/api/chat', {
    method: payload ? 'POST' : 'GET',
    credentials: 'same-origin',
    ...(payload ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) } : {}),
    signal,
  })
  let result
  try { result = await response.json() } catch { throw new Error('invalid_response') }
  if (!result || typeof result.status !== 'string') throw new Error('invalid_response')
  if (!response.ok) throw Object.assign(new Error(result.status), { result })
  const state = result.state
  if (!state || typeof state.conversation_id !== 'string' || typeof state.can_send !== 'boolean'
      || typeof state.closed !== 'boolean' || !Number.isInteger(state.completed_rounds)
      || !result.policy || result.policy.reveal_delay_ms !== 800) throw new Error('invalid_response')
  if (result.status === 'completed' && (typeof result.result?.reply !== 'string'
      || typeof result.result?.topic !== 'string' || typeof result.result?.action !== 'string')) throw new Error('invalid_response')
  return result
}

export function sendChatMessage(payload, options) { return chatRequest({ ...payload, operation: 'send' }, options) }
export const chatbotApi = {
  session: (options) => chatRequest(null, options),
  send: sendChatMessage,
  command: (operation, conversationId, options) => chatRequest({ operation, conversation_id: conversationId }, options),
}
