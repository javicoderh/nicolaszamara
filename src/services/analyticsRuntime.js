import { getAnalyticsSettings } from '../config/analytics.js'
import { analyticsAllowed } from './analyticsPermission.js'
import { consentStore } from './consentService.js'
import { createGa4Adapter } from './ga4Adapter.js'
import { createPageContext } from './analyticsPageContext.js'
import { createMarketingTracker } from './marketingTracker.js'
import { createCampaignAttribution } from './campaignAttribution.js'

let runtime = null

function getRuntime() {
  if (runtime || typeof window === 'undefined') return runtime
  const settings = getAnalyticsSettings()
  const adapter = createGa4Adapter({ measurementId: settings.ga4Id, environment: settings.environment,
    allowed: analyticsAllowed, windowRef: window, documentRef: document })
  runtime = { adapter, page: createPageContext(window.location.pathname, document.referrer) }
  const attribution = createCampaignAttribution({ allowed: analyticsAllowed, storage: {
    getItem: (key) => window.sessionStorage.getItem(key), setItem: (key, value) => window.sessionStorage.setItem(key, value),
    removeItem: (key) => window.sessionStorage.removeItem(key),
  } })
  runtime.tracker = createMarketingTracker({ allowed: analyticsAllowed, adapter, page: () => {
    adapter.setCampaign(attribution.touch({ search: window.location.search, referrer: document.referrer })?.campaign)
    return runtime.page
  },
    dispatch: (eventName, params) => window.dispatchEvent(new CustomEvent('nzamara:metric', { detail: { eventName, params } })) })
  consentStore.subscribe(() => { if (!analyticsAllowed()) { runtime.tracker.revoke(); attribution.revoke() } })
  return runtime
}

export function updateAnalyticsPage(page) {
  const current = getRuntime()
  if (current) { current.page = page; current.adapter.updatePage(page) }
}

export function trackMarketingEvent(name, params) {
  return getRuntime()?.tracker.track(name, params) || false
}
