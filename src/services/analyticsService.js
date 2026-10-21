const allowedEvents = new Set([
  'hotmart_click',
  'whatsapp_click',
  'online_interest_saved',
  'nature_interest_saved',
])

export function trackEvent(eventName) {
  if (!allowedEvents.has(eventName) || typeof window === 'undefined') return false
  window.dispatchEvent(new CustomEvent('nzamara:metric', { detail: { eventName } }))
  return true
}
