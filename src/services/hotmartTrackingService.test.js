import { afterEach, expect, it, vi } from 'vitest'
import { trackHotmartClick } from './hotmartTrackingService.js'

afterEach(() => { vi.unstubAllGlobals(); window.history.replaceState({}, '', '/') })

it.each([['chatbot', '/chatbot'], ['course', '/cursos'], ['home', '/']])('records %s independently with the browser cookie', async (source, path) => {
  window.history.replaceState({}, '', `${path}?ref=test#section`)
  const fetchMock = vi.fn().mockResolvedValue({ ok: true })
  vi.stubGlobal('fetch', fetchMock)
  expect(await trackHotmartClick(source)).toBe(true)
  expect(fetchMock).toHaveBeenCalledWith('/api/hotmart_click', expect.objectContaining({
    credentials: 'same-origin', keepalive: true, method: 'POST',
  }))
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ event_id: expect.any(String), source, source_path: path })
})

it('reuses the event ID after an uncertain network failure', async () => {
  const fetchMock = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue({ ok: true })
  vi.stubGlobal('fetch', fetchMock)
  expect(await trackHotmartClick('home')).toBe(true)
  expect(fetchMock.mock.calls[0][1].body).toBe(fetchMock.mock.calls[1][1].body)
})

it('absorbs a delivery failure so the actual link can continue', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  expect(await trackHotmartClick('home')).toBe(false)
})
