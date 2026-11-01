import { afterEach, expect, it, vi } from 'vitest'
import { adminRequest, getAdminInterests, AdminError } from './adminService.js'

afterEach(() => vi.unstubAllGlobals())
it('uses a same-origin cookie and CSRF header without putting credentials in a URL', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'authenticated' }) })
  vi.stubGlobal('fetch', fetch)
  const controller = new AbortController()
  await adminRequest({ operation: 'login', username: 'unit', password: 'unit-only-password' }, controller.signal)
  expect(fetch).toHaveBeenCalledWith('/api/admin', expect.objectContaining({ credentials: 'same-origin', cache: 'no-store', signal: controller.signal, headers: { 'Content-Type': 'application/json', 'X-Admin-Request': '1' } }))
  expect(JSON.parse(fetch.mock.calls[0][1].body).password).toBe('unit-only-password')
})
it('preserves authentication errors and forwards bounded query parameters', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ status: 'unauthorized' }) }))
  await expect(getAdminInterests(undefined, JSON.stringify({ filters: { mode: 'all' }, cursor: null }))).rejects.toEqual(new AdminError('unauthorized'))
})
