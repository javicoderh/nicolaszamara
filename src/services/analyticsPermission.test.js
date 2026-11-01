import { afterEach, expect, it, vi } from 'vitest'
import { analyticsAllowed } from './analyticsPermission.js'
import { consentStore, CONSENT_MAX_AGE_MS } from './consentService.js'
import { getAnalyticsSettings } from '../config/analytics.js'

vi.mock('../config/analytics.js', () => ({ getAnalyticsSettings: vi.fn(() => ({ enabled: true })) }))
vi.mock('./consentService.js', async (original) => ({ ...await original(), consentStore: { getSnapshot: vi.fn() } }))
afterEach(() => vi.restoreAllMocks())

it('requires both enabled environment and fresh category-specific consent', () => {
  vi.mocked(consentStore.getSnapshot).mockReturnValue({ status: 'accepted', analytics: true, experience: false, updatedAt: new Date().toISOString() })
  expect(analyticsAllowed()).toBe(true)
  expect(analyticsAllowed('experience')).toBe(false)
  vi.mocked(getAnalyticsSettings).mockReturnValueOnce({ enabled: false })
  expect(analyticsAllowed()).toBe(false)
  vi.mocked(consentStore.getSnapshot).mockReturnValue({ status: 'accepted', analytics: true, updatedAt: new Date(Date.now() - CONSENT_MAX_AGE_MS).toISOString() })
  expect(analyticsAllowed()).toBe(false)
})
