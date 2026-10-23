import { afterEach, describe, expect, it, vi } from 'vitest'
import { submitInterest } from './interestService.js'

afterEach(() => { vi.unstubAllGlobals(); window.history.replaceState({}, '', '/') })

describe('submitInterest', () => {
  it('envía JSON al mismo origen y propaga la cancelación', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 201, json: async () => ({ status: 'saved' }) })
    vi.stubGlobal('fetch', fetchMock)
    const payload = { interest: 'nature' }
    const controller = new AbortController()
    await expect(submitInterest(payload, { signal: controller.signal })).resolves.toEqual({ status: 'saved' })
    expect(fetchMock).toHaveBeenCalledWith('/api/interests', expect.objectContaining({ method: 'POST', body: JSON.stringify({ ...payload, source_path: '/' }), signal: controller.signal }))
  })

  it('captures the real route without query strings or fragments', async () => {
    window.history.replaceState({}, '', '/cursos?ref=example#interes-online')
    const fetchMock = vi.fn().mockResolvedValue({ status: 201, json: async () => ({ status: 'saved' }) })
    vi.stubGlobal('fetch', fetchMock)
    await submitInterest({ interest: 'online' })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).source_path).toBe('/cursos')
  })

  it.each([200, 400, 500, 503])('rechaza éxito aparente si HTTP devuelve %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status, json: async () => ({ status: 'saved' }) }))
    await expect(submitInterest({})).resolves.toEqual({ status: 'unavailable' })
  })

  it('identifica solicitudes limitadas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 429, json: async () => ({}) }))
    await expect(submitInterest({})).resolves.toEqual({ status: 'rate_limited' })
  })

  it('no inventa éxito con HTML o pérdida de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, json: async () => { throw new SyntaxError('HTML') } }))
    await expect(submitInterest({})).rejects.toThrow()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')))
    await expect(submitInterest({})).rejects.toThrow()
  })
})
