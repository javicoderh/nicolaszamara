import { trackEvent } from './analyticsService.js'

const fields = { name: 'name', email: 'email', phone: 'phone', contactPreference: 'contact_preference', city: 'city', country: 'country', privacyConsent: 'privacy_consent' }

export function formPlacement(kind, path) {
  if (kind === 'consultation') return 'consultation_form'
  if (kind === 'online') return 'courses_online_form'
  return path === '/naturaleza' ? 'nature_page_form' : 'home_nature_form'
}

export function createFormMetrics({ kind, placement, service = () => kind, source = 'form', emit = trackEvent }) {
  let started = false, submitted = false, saved = false, lastError = null
  const invalid = new Set()
  const common = () => ({ form_kind: kind, placement })
  const start = () => {
    if (!started && emit('form_start', common())) started = true
  }
  return {
    start,
    invalid(target) {
      const field_id = fields[target.name] || 'form'
      const error_code = target.name === 'privacyConsent' ? 'consent_required' : target.validity?.valueMissing ? 'required'
        : target.validity?.tooLong ? 'too_long' : 'format'
      const key = `${field_id}:${error_code}`
      if (!invalid.has(key) && emit('form_validation_error', { ...common(), field_id, error_code })) invalid.add(key)
    },
    attempt() {
      start()
      if (!submitted) { emit('form_submit_attempt', common()); submitted = true }
      else if (lastError) emit('form_retry', { ...common(), error_code: lastError })
      lastError = null
      invalid.clear()
    },
    error(code) {
      lastError = ['rate_limited', 'timeout', 'network'].includes(code) ? code : 'unavailable'
      emit('form_submit_error', { ...common(), error_code: lastError })
    },
    success() {
      if (saved) return
      saved = true
      emit('generate_lead', { ...common(), service: service() || 'general', lead_source: source })
    },
    reset() { started = false; submitted = false; saved = false; lastError = null; invalid.clear() },
  }
}
