import { analyticsAllowed } from './analyticsPermission.js'
import { trackMarketingEvent } from './analyticsRuntime.js'

const allowedEvents = new Set([
  'hotmart_click',
  'whatsapp_click',
  'online_interest_saved',
  'nature_interest_saved',
  'consultation_interest_saved',
  'chat_contact_saved',
])

export function trackEvent(eventName, params) {
  if (params !== undefined) return trackMarketingEvent(eventName, params)
  // Legacy local-only events are removed control by control in M05/M06.
  // They never go to GA4 alongside the replacement event.
  if (!allowedEvents.has(eventName) || typeof window === 'undefined' || !analyticsAllowed()) return false
  window.dispatchEvent(new CustomEvent('nzamara:metric', { detail: { eventName } }))
  return true
}
