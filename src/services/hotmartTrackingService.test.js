import { afterEach, expect, it, vi } from 'vitest'
import { trackHotmartClick } from './hotmartTrackingService.js'
import { analyticsAllowed } from './analyticsPermission.js'
vi.mock('./analyticsPermission.js', () => ({ analyticsAllowed: vi.fn(() => true) }))

it('does not send or identify a browser without consent', async () => {
  vi.mocked(analyticsAllowed).mockReturnValueOnce(false)
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  expect(await trackHotmartClick('home')).toBe(false)
  expect(fetchMock).not.toHaveBeenCalled()
})

it('drops a queued click if permission is revoked before delivery', async () => {
  vi.mocked(analyticsAllowed).mockReturnValueOnce(true).mockReturnValueOnce(false).mockReturnValueOnce(false)
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  expect(await trackHotmartClick('home')).toBe(false)
  expect(fetchMock).not.toHaveBeenCalled()
})

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
