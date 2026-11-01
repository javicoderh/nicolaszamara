import { useEffect, useRef } from 'react'
import { useAnalyticsConsent } from '../../contexts/AnalyticsConsentContext/AnalyticsConsentContext.jsx'
import { analyticsAllowed } from '../../services/analyticsPermission.js'
import { exposureFor } from '../../services/analyticsSensors.js'
import { trackEvent } from '../../services/analyticsService.js'

export function usePageSensors(path, ready) {
  const preferences = useAnalyticsConsent()
  const view = useRef(null)
  if (view.current?.path !== path) view.current = { path, seen: new Set() }
  useEffect(() => {
    if (!ready || !preferences?.consent.analytics || !analyticsAllowed() || typeof IntersectionObserver === 'undefined') return
    const seen = view.current.seen
    const targets = new Map()
    function stop(state) { clearTimeout(state.timer); state.timer = null }
    function schedule(element, state) {
      stop(state)
      if (!state.visible || document.visibilityState !== 'visible' || seen.has(state.key)) return
      state.timer = setTimeout(() => {
        if (analyticsAllowed() && state.visible && document.visibilityState === 'visible' && trackEvent(state.name, state.params)) {
          seen.add(state.key)
          observer.unobserve(element)
        }
      }, 1000)
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const state = targets.get(entry.target)
        if (!state) continue
        state.visible = entry.isIntersecting && entry.intersectionRatio >= .5
        schedule(entry.target, state)
      }
    }, { threshold: [.5] })
    function discover() {
      for (const [element, state] of targets) if (!element.isConnected) { stop(state); observer.unobserve(element); targets.delete(element) }
      document.querySelectorAll('[data-analytics-section], [data-analytics-cta]').forEach((element) => {
        if (targets.has(element)) return
        const exposure = exposureFor(element)
        if (!exposure) return
        const key = `${exposure.name}:${JSON.stringify(exposure.params)}`
        if (seen.has(key)) return
        targets.set(element, { ...exposure, key, timer: null, visible: false })
        observer.observe(element)
      })
    }
    function visibility() { targets.forEach((state, element) => schedule(element, state)) }
    discover()
    const mutations = new MutationObserver(discover)
    mutations.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('visibilitychange', visibility)
    return () => {
      observer.disconnect(); mutations.disconnect()
      targets.forEach(stop)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [path, ready, preferences?.consent.analytics])
}
