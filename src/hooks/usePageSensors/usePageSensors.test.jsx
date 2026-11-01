import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePageSensors } from './usePageSensors.js'
import { trackEvent } from '../../services/analyticsService.js'
import { analyticsAllowed } from '../../services/analyticsPermission.js'

vi.mock('../../services/analyticsService.js', () => ({ trackEvent: vi.fn(() => true) }))
vi.mock('../../services/analyticsPermission.js', () => ({ analyticsAllowed: vi.fn(() => true) }))
vi.mock('../../contexts/AnalyticsConsentContext/AnalyticsConsentContext.jsx', () => ({ useAnalyticsConsent: () => ({ consent: { analytics: true } }) }))
let instances, target
beforeEach(() => {
  vi.useFakeTimers()
  instances = []
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback) { this.callback = callback; instances.push(this) }
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  })
  target = document.createElement('h2')
  target.setAttribute('data-analytics-section', 'home_hero')
  document.body.appendChild(target)
})
afterEach(() => { target.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
function intersect(visible) {
  instances.at(-1).callback([{ target, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }])
}
describe('page exposure sensors', () => {
  it('requires a continuous second and deduplicates each section within a visit', () => {
    const { rerender } = renderHook(({ path }) => usePageSensors(path, true), { initialProps: { path: '/' } })
    act(() => { intersect(true); vi.advanceTimersByTime(999) })
    expect(trackEvent).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(trackEvent).toHaveBeenCalledWith('section_view', { section_id: 'home_hero' })
    act(() => { intersect(true); vi.advanceTimersByTime(1000) })
    expect(trackEvent).toHaveBeenCalledOnce()
    rerender({ path: '/cursos' })
    act(() => { intersect(true); vi.advanceTimersByTime(1000) })
    expect(trackEvent).toHaveBeenCalledTimes(2)
  })
  it('cancels dwell on leaving, hidden tabs and unmount', () => {
    const { unmount } = renderHook(() => usePageSensors('/', true))
    act(() => { intersect(true); vi.advanceTimersByTime(500); intersect(false); vi.advanceTimersByTime(1000) })
    expect(trackEvent).not.toHaveBeenCalled()
    act(() => { intersect(true); vi.advanceTimersByTime(500) })
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => { document.dispatchEvent(new Event('visibilitychange')); vi.advanceTimersByTime(2000) })
    expect(trackEvent).not.toHaveBeenCalled()
    unmount()
    expect(instances[0].disconnect).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('never observes a skeleton or a page without permission', () => {
    const { rerender } = renderHook(({ ready }) => usePageSensors('/', ready), { initialProps: { ready: false } })
    expect(instances).toHaveLength(0)
    vi.mocked(analyticsAllowed).mockReturnValueOnce(false)
    rerender({ ready: true })
    expect(instances).toHaveLength(0)
  })
})
