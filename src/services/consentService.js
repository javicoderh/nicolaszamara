export const CONSENT_STORAGE_KEY = 'nzamara:analytics-consent'
export const CONSENT_VERSION = '2026-10-29-analytics-v1'
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000
export const UNKNOWN_CONSENT = Object.freeze({ status: 'unknown', analytics: false, experience: false, version: CONSENT_VERSION, updatedAt: null })

function browserStorage() {
  try { return typeof window === 'undefined' ? null : window.localStorage } catch { return null }
}

export function parseConsent(raw, now = Date.now()) {
  try {
    const value = JSON.parse(raw)
    if (!value || Object.keys(value).sort().join() !== 'analytics,experience,status,updatedAt,version') return UNKNOWN_CONSENT
    const time = Date.parse(value.updatedAt)
    if (value.version !== CONSENT_VERSION || typeof value.analytics !== 'boolean' || typeof value.experience !== 'boolean'
      || !Number.isFinite(time) || time > now || now - time >= CONSENT_MAX_AGE_MS
      || value.status !== (value.analytics || value.experience ? 'accepted' : 'rejected')) return UNKNOWN_CONSENT
    return Object.freeze(value)
  } catch { return UNKNOWN_CONSENT }
}

export function clearAnalyticsCookies(documentRef = typeof document === 'undefined' ? null : document,
  hostname = typeof window === 'undefined' ? '' : window.location.hostname) {
  if (!documentRef) return
  const names = documentRef.cookie.split(';').map((part) => part.trim().split('=')[0])
    .filter((name) => /^_ga(?:_|$)|^_cl(?:ck|sk)$/.test(name))
  const labels = hostname.split('.')
  const domains = ['', ...labels.map((_, index) => labels.slice(index).join('.')).filter((domain) => domain.includes('.'))]
  for (const name of names) for (const domain of domains) {
    documentRef.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`
  }
}

// A functional preference only: no analytics IDs, provider calls or network.
export function createConsentStore({ storage = browserStorage(), now = Date.now, onRevoke = () => {} } = {}) {
  const listeners = new Set()
  function read() {
    try { return parseConsent(storage?.getItem(CONSENT_STORAGE_KEY), now()) } catch { return UNKNOWN_CONSENT }
  }
  let snapshot = read()
  function publish(next) {
    if (JSON.stringify(next) === JSON.stringify(snapshot)) return
    const previous = snapshot
    snapshot = next
    if ((previous.analytics && !next.analytics) || (previous.experience && !next.experience)) {
      try { onRevoke() } catch { /* Storage restrictions must not prevent revocation. */ }
    }
    listeners.forEach((listener) => listener())
  }
  function reload() { publish(read()) }
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => UNKNOWN_CONSENT,
    subscribe(listener) {
      listeners.add(listener)
      const sync = (event) => { if (event.key === CONSENT_STORAGE_KEY || event.key === null) reload() }
      if (typeof window !== 'undefined') { window.addEventListener('storage', sync); window.addEventListener('focus', reload) }
      return () => {
        listeners.delete(listener)
        if (typeof window !== 'undefined') { window.removeEventListener('storage', sync); window.removeEventListener('focus', reload) }
      }
    },
    save({ analytics, experience }) {
      if (typeof analytics !== 'boolean' || typeof experience !== 'boolean') return false
      const next = Object.freeze({ status: analytics || experience ? 'accepted' : 'rejected', analytics, experience,
        version: CONSENT_VERSION, updatedAt: new Date(now()).toISOString() })
      try { storage?.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next)) } catch { /* Keep the user's choice in memory. */ }
      publish(next)
      return true
    },
    reload,
  }
}

export const consentStore = createConsentStore({ onRevoke: clearAnalyticsCookies })
