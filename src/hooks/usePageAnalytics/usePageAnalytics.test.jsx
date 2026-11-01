import { StrictMode } from 'react'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePageAnalytics } from './usePageAnalytics.js'
import { trackEvent } from '../../services/analyticsService.js'
import { useAnalyticsConsent } from '../../contexts/AnalyticsConsentContext/AnalyticsConsentContext.jsx'

vi.mock('../../services/analyticsService.js', () => ({ trackEvent: vi.fn(() => true) }))
vi.mock('../../services/analyticsRuntime.js', () => ({ updateAnalyticsPage: vi.fn() }))
vi.mock('../../contexts/AnalyticsConsentContext/AnalyticsConsentContext.jsx', () => ({ useAnalyticsConsent: vi.fn() }))
beforeEach(() => vi.mocked(useAnalyticsConsent).mockReturnValue({ consent: { analytics: true } }))
describe('usePageAnalytics', () => {
  it('waits for content and counts direct, internal and return visits only once', () => {
    const { rerender } = renderHook(({ path, ready }) => usePageAnalytics(path, ready), { initialProps: { path: '/', ready: false }, wrapper: StrictMode })
    expect(trackEvent).not.toHaveBeenCalled()
    rerender({ path: '/', ready: true })
    rerender({ path: '/', ready: true })
    expect(trackEvent).toHaveBeenCalledTimes(1)
    rerender({ path: '/cursos', ready: false })
    expect(trackEvent).toHaveBeenCalledTimes(1)
    rerender({ path: '/cursos', ready: true })
    expect(trackEvent).toHaveBeenLastCalledWith('page_view', expect.objectContaining({ page_location: 'https://www.nicolaszamara.com/cursos', page_referrer: 'https://www.nicolaszamara.com/' }))
    rerender({ path: '/', ready: true })
    expect(trackEvent).toHaveBeenCalledTimes(3)
  })
  it('does not replay navigation before consent or a view already sent', () => {
    vi.mocked(useAnalyticsConsent).mockReturnValue({ consent: { analytics: false } })
    const { rerender } = renderHook(({ path }) => usePageAnalytics(path, true), { initialProps: { path: '/' } })
    rerender({ path: '/cursos' })
    expect(trackEvent).not.toHaveBeenCalled()
    vi.mocked(useAnalyticsConsent).mockReturnValue({ consent: { analytics: true } })
    rerender({ path: '/cursos' })
    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenLastCalledWith('page_view', expect.objectContaining({ page_referrer: '' }))
    vi.mocked(useAnalyticsConsent).mockReturnValue({ consent: { analytics: true } })
    rerender({ path: '/cursos' })
    expect(trackEvent).toHaveBeenCalledTimes(1)
  })
})
