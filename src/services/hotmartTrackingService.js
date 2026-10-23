import { trackEvent } from './analyticsService.js'
import { currentSourcePath } from './sourceContext.js'

let delivery = Promise.resolve()

// Queue initial deliveries so the first response can establish the shared cookie.
// No preventDefault: metrics must never block the real Hotmart link.
export function trackHotmartClick(source) {
  trackEvent('hotmart_click')
  const payload = { event_id: crypto.randomUUID(), source, source_path: currentSourcePath() }
  const send = () => {
    const controller = new AbortController()
    const deadline = setTimeout(() => controller.abort(), 8000)
    return fetch('/api/hotmart_click', {
      method: 'POST', credentials: 'same-origin', keepalive: true, signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    }).then((response) => response.ok).finally(() => clearTimeout(deadline))
  }
  delivery = delivery.then(() => send().catch(() => send())).catch(() => false)
  return delivery
}
