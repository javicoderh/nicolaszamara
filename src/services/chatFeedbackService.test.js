import { afterEach, expect, it, vi } from 'vitest'
import { submitChatFeedback } from './chatFeedbackService.js'

afterEach(() => vi.unstubAllGlobals())

it('sends only the explicit proposal through the same-origin API', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'saved' }) })
  vi.stubGlobal('fetch', fetchMock)
  const payload = { question: 'Un caso', suggestion: 'Una respuesta revisable' }, controller = new AbortController()
  await expect(submitChatFeedback(payload, { signal: controller.signal })).resolves.toEqual({ status: 'saved' })
  expect(fetchMock).toHaveBeenCalledWith('/api/chat_feedback', expect.objectContaining({
    credentials: 'same-origin', method: 'POST', body: JSON.stringify(payload), signal: controller.signal,
  }))
})

it('does not claim a save on a rejected request', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ status: 'not_found' }) }))
  await expect(submitChatFeedback({})).rejects.toThrow('not_found')
})
