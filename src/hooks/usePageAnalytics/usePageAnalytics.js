import { useEffect, useRef } from 'react'
import { useAnalyticsConsent } from '../../contexts/AnalyticsConsentContext/AnalyticsConsentContext.jsx'
import { createPageContext } from '../../services/analyticsPageContext.js'
import { updateAnalyticsPage } from '../../services/analyticsRuntime.js'
import { trackEvent } from '../../services/analyticsService.js'

export function usePageAnalytics(path, ready) {
  const preferences = useAnalyticsConsent()
  const current = useRef(null)
  if (current.current?.path !== path) current.current = { path, sent: false,
    page: createPageContext(path, preferences?.consent.analytics
      ? current.current?.page?.page_location || (typeof document === 'undefined' ? '' : document.referrer) : '') }
  useEffect(() => {
    const view = current.current
    updateAnalyticsPage(view.page)
    if (!ready || view.sent || !preferences?.consent.analytics) return
    const { page_title, page_location, page_referrer } = view.page
    if (trackEvent('page_view', { page_title, page_location, page_referrer })) view.sent = true
  }, [path, ready, preferences?.consent])
}
