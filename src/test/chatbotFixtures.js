import { vi } from 'vitest'

export function sessionResult(state = {}, extra = {}) {
  return { status: 'ready', provider_enabled: true,
    policy: { max_completed_rounds: 10, max_context_messages: 12, reveal_delay_ms: 800 },
    state: { conversation_id: '11111111-1111-4111-8111-111111111111', completed_rounds: 0,
      provider_attempts: 0, topic: 'unknown', action: 'none', can_send: true, closed: false,
      capturing: false, busy: false, contact_declined: false, last_result: null, ...state }, ...extra }
}

export function mockChatApi(initial = sessionResult()) {
  return { session: vi.fn().mockResolvedValue(initial),
    send: vi.fn().mockResolvedValue(sessionResult({ completed_rounds: 1, topic: 'course', action: 'show_hotmart' },
      { status: 'completed', result: { reply: 'Aquí tienes el curso.', topic: 'course', action: 'show_hotmart' } })),
    command: vi.fn().mockResolvedValue(initial) }
}
