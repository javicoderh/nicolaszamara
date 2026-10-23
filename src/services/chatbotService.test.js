import { afterEach, describe, expect, it, vi } from 'vitest'
import { chatbotApi, sendChatMessage } from './chatbotService.js'
import { sessionResult } from '../test/chatbotFixtures.js'

afterEach(() => vi.unstubAllGlobals())
describe('chatbot API', () => {
  it('refreshes the server conversation after establishing the existing signed session', async () => {
    const initial = sessionResult({ completed_rounds: 2, topic: 'online', capturing: true })
    const fresh = sessionResult({ conversation_id: '22222222-2222-4222-8222-222222222222' })
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => initial })
      .mockResolvedValueOnce({ ok: true, json: async () => fresh })
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()
    await expect(chatbotApi.session({ fresh: true, signal: controller.signal })).resolves.toEqual(fresh)
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/chat', expect.objectContaining({ method: 'GET', credentials: 'same-origin', signal: controller.signal }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/chat', expect.objectContaining({ method: 'POST', credentials: 'same-origin', signal: controller.signal,
      body: JSON.stringify({ operation: 'refresh', conversation_id: initial.state.conversation_id }) }))
  })

  it('handles a concurrent refresh once using the current conversation ID', async () => {
    const changed = sessionResult({ conversation_id: '22222222-2222-4222-8222-222222222222' }, { status: 'conversation_changed' })
    const fresh = sessionResult({ conversation_id: changed.state.conversation_id })
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => sessionResult() })
      .mockResolvedValueOnce({ ok: true, json: async () => changed }).mockResolvedValueOnce({ ok: true, json: async () => fresh })
    vi.stubGlobal('fetch', fetchMock)
    await expect(chatbotApi.session({ fresh: true })).resolves.toEqual(fresh)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ operation: 'refresh', conversation_id: changed.state.conversation_id })
  })
  it('recovers a same-origin session without sending messages', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => sessionResult() })
    vi.stubGlobal('fetch', fetchMock)
    await expect(chatbotApi.session()).resolves.toHaveProperty('state.can_send', true)
    expect(fetchMock).toHaveBeenCalledWith('/api/chat', expect.objectContaining({ method: 'GET', credentials: 'same-origin' }))
  })
  it('preserves decision metadata, state and request identity', async () => {
    const value = sessionResult({}, { status: 'completed', result: { reply: 'Respuesta', topic: 'course', action: 'show_hotmart' } })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => value })
    vi.stubGlobal('fetch', fetchMock)
    const payload = { request_id: 'stable', conversation_id: 'conversation', messages: [{ role: 'user', content: 'Curso' }] }
    const controller = new AbortController()
    await expect(sendChatMessage(payload, { signal: controller.signal })).resolves.toEqual(value)
    expect(fetchMock).toHaveBeenCalledWith('/api/chat', expect.objectContaining({ body: JSON.stringify({ ...payload, operation: 'send' }), signal: controller.signal }))
  })
  it('preserves error state for recovery', async () => {
    const result = sessionResult({}, { status: 'provider_failed' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => result }))
    await expect(chatbotApi.session()).rejects.toMatchObject({ message: 'provider_failed', result })
  })
  it.each([{}, { status: 'ready' }, sessionResult({ can_send: 'yes' }), sessionResult({}, { status: 'completed', result: {} })])('rejects incomplete API data', async (result) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => result }))
    await expect(chatbotApi.session()).rejects.toThrow('invalid_response')
  })
  it('rejects non-JSON responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => { throw new SyntaxError() } }))
    await expect(chatbotApi.session()).rejects.toThrow('invalid_response')
  })
})
