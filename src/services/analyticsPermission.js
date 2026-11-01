import { getAnalyticsSettings } from '../config/analytics.js'
import { consentStore, CONSENT_MAX_AGE_MS } from './consentService.js'

export function analyticsAllowed(category = 'analytics') {
  const consent = consentStore.getSnapshot()
  return getAnalyticsSettings().enabled && consent.status === 'accepted' && consent[category] === true
    && Date.now() - Date.parse(consent.updatedAt) < CONSENT_MAX_AGE_MS
}
