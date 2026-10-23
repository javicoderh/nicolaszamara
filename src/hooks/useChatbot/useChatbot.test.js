import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatbot } from './useChatbot.js'
import { mockChatApi, sessionResult } from '../../test/chatbotFixtures.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())
async function reveal() { await act(async () => vi.advanceTimersByTimeAsync(800)) }
async function loaded(api) {
  const hook = renderHook(() => useChatbot(api))
  act(() => hook.result.current.loadSession()); await reveal()
  return hook
}
describe('useChatbot', () => {
  it('clears the old topic, contact flow and draft when a fresh server session replaces it', async () => {
    const api = mockChatApi(sessionResult({ completed_rounds: 2, topic: 'online', capturing: true,
      last_result: { reply: 'Orientación anterior' } }))
    const { result } = await loaded(api)
    act(() => result.current.setDraft('Borrador anterior'))
    api.session.mockResolvedValue(sessionResult({ conversation_id: '22222222-2222-4222-8222-222222222222' }))
    act(() => result.current.loadSession({ fresh: true, restoreMessages: false }))
    await reveal()
    expect(api.session).toHaveBeenLastCalledWith(expect.objectContaining({ fresh: true }))
    expect(result.current.session.state).toMatchObject({ completed_rounds: 0, topic: 'unknown', capturing: false })
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.draft).toBe('')
    expect(result.current.recovered).toBe(false)
  })
  it('restores server state and last approved response without a provider call', async () => {
    const api = mockChatApi(sessionResult({ completed_rounds: 9, last_result: { reply: 'Última orientación' } }))
    const { result } = await loaded(api)
    expect(result.current.messages.at(-1).content).toBe('Última orientación')
    expect(result.current.recovered).toBe(true)
    expect(api.send).not.toHaveBeenCalled()
  })
  it('blocks duplicate sends before React rerenders and preserves metadata', async () => {
    const api = mockChatApi(), { result } = await loaded(api)
    act(() => { result.current.send('Curso'); result.current.send('Curso') })
    await reveal()
    expect(api.send).toHaveBeenCalledTimes(1)
    expect(result.current.session.state.topic).toBe('course')
    expect(result.current.messages.filter((message) => message.role === 'user')).toHaveLength(1)
    expect(result.current.messages.at(-1)).toMatchObject({
      requestId: api.send.mock.calls[0][0].request_id,
      conversationId: result.current.session.state.conversation_id,
      action: 'show_hotmart',
    })
  })
  it('reuses the request ID after an uncertain transport failure', async () => {
    const api = mockChatApi(), { result } = await loaded(api)
    api.send.mockRejectedValueOnce(new Error('request_timeout'))
    act(() => result.current.send('Curso')); await reveal()
    const first = api.send.mock.calls[0][0]
    act(() => result.current.retry()); await reveal()
    expect(api.send.mock.calls[1][0]).toEqual(first)
    expect(result.current.messages.filter((message) => message.role === 'user')).toHaveLength(1)
  })
  it('makes a new attempt only after explicit retry of a definitive provider failure', async () => {
    const api = mockChatApi(), { result } = await loaded(api)
    api.send.mockRejectedValueOnce(Object.assign(new Error('provider_failed'), { result: sessionResult({}, { status: 'provider_failed' }) }))
    act(() => result.current.send('Curso')); await reveal()
    expect(result.current.retryIsFresh).toBe(true)
    const first = api.send.mock.calls[0][0].request_id
    act(() => result.current.retry()); await reveal()
    expect(api.send.mock.calls[1][0].request_id).not.toBe(first)
  })
  it('does not send messages while capture or quotas block the conversation', async () => {
    const api = mockChatApi(sessionResult({ capturing: true, can_send: false }))
    const { result } = await loaded(api)
    act(() => result.current.send('Private data'))
    expect(api.send).not.toHaveBeenCalled()
  })
  it('recovers a lost response while the local user message exists, without duplicating it on refresh', async () => {
    const api = mockChatApi(), { result } = await loaded(api)
    api.send.mockRejectedValueOnce(new Error('request_timeout'))
    act(() => result.current.send('Curso')); await reveal()
    const requestId = api.send.mock.calls[0][0].request_id
    api.session.mockResolvedValue(sessionResult({ completed_rounds: 1, last_result: { reply: 'Respuesta recuperada', request_id: requestId } }))
    act(() => result.current.loadSession()); await reveal()
    expect(result.current.messages.at(-1).content).toBe('Respuesta recuperada')
    expect(result.current.canRetry).toBe(false)
    act(() => result.current.loadSession()); await reveal()
    expect(result.current.messages.filter((message) => message.content === 'Respuesta recuperada')).toHaveLength(1)
    expect(api.send).toHaveBeenCalledTimes(1)
  })
  it('replaces history and draft when another tab has started a new conversation', async () => {
    const api = mockChatApi(), { result } = await loaded(api)
    act(() => result.current.setDraft('Texto anterior'))
    api.session.mockResolvedValue(sessionResult({ conversation_id: '22222222-2222-4222-8222-222222222222' }))
    act(() => result.current.loadSession()); await reveal()
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.draft).toBe('')
  })
})
