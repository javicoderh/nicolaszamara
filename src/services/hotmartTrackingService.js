import { trackEvent } from './analyticsService.js'
import { currentSourcePath } from './sourceContext.js'
import { analyticsAllowed } from './analyticsPermission.js'
import { consentStore } from './consentService.js'

let delivery = Promise.resolve()
const controllers = new Set()
consentStore.subscribe(() => {
  if (!analyticsAllowed()) controllers.forEach((controller) => controller.abort())
})

// Queue initial deliveries so the first response can establish the shared cookie.
// No preventDefault: metrics must never block the real Hotmart link.
export function trackHotmartClick(source, measurement) {
  if (!analyticsAllowed()) return Promise.resolve(false)
  trackEvent('hotmart_click', measurement ? { ...measurement, source } : undefined)
  const payload = { event_id: crypto.randomUUID(), source, source_path: currentSourcePath() }
  const send = () => {
    if (!analyticsAllowed()) return Promise.resolve(false)
    const controller = new AbortController()
    controllers.add(controller)
    const deadline = setTimeout(() => controller.abort(), 8000)
    return fetch('/api/hotmart_click', {
      method: 'POST', credentials: 'same-origin', keepalive: true, signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    }).then((response) => response.ok).finally(() => { clearTimeout(deadline); controllers.delete(controller) })
  }
  delivery = delivery.then(() => send().catch(() => send())).catch(() => false)
  return delivery
}
