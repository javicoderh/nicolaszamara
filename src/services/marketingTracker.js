import { ANALYTICS_QUEUE_LIMIT, ANALYTICS_QUEUE_TTL_MS, validateAnalyticsEvent } from '../config/analytics.js'

// Transport is injected: no provider, timer or browser required to test the queue.
export function createMarketingTracker({ allowed, adapter, page, dispatch = () => {}, now = Date.now }) {
  let pending = []
  let sending = false
  let generation = 0
  async function drain() {
    if (sending) return
    sending = true
    const current = generation
    try {
      while (pending.length && current === generation) {
        if (!allowed()) { pending = []; break }
        const item = pending.shift()
        if (now() - item.time >= ANALYTICS_QUEUE_TTL_MS) continue
        try { await adapter.send(item.name, item.params, item.page,
          () => current === generation && allowed() && now() - item.time < ANALYTICS_QUEUE_TTL_MS) } catch { /* Never disrupt the real action. */ }
      }
    } finally {
      sending = false
      if (pending.length && allowed()) void drain()
    }
  }
  return {
    track(name, params) {
      if (!allowed() || !validateAnalyticsEvent(name, params)) return false
      const item = { name, params: { ...params }, page: { ...page() }, time: now() }
      if (pending.length >= ANALYTICS_QUEUE_LIMIT) pending.shift()
      pending.push(item)
      try { dispatch(name, item.params) } catch { /* Local listeners must not break controls. */ }
      void drain()
      return true
    },
    revoke() { generation += 1; pending = []; adapter.stop() },
  }
}
