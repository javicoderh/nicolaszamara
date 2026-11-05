import { describe, expect, it } from 'vitest'
import { ANALYTICS_EVENTS, LEGACY_ANALYTICS_EVENTS, validateAnalyticsEvent, getAnalyticsSettings } from './analytics.js'

describe('analytics contract', () => {
  it('defaults to off and requires explicit QA activation outside production hosts', () => {
    expect(getAnalyticsSettings({}, 'www.nicolaszamara.com').enabled).toBe(false)
    expect(getAnalyticsSettings({ MODE: 'production', VITE_ANALYTICS_ENABLED: 'true' }, 'preview.vercel.app').enabled).toBe(false)
    expect(getAnalyticsSettings({ MODE: 'production', VITE_ANALYTICS_ENABLED: 'true' }, 'www.nicolaszamara.com').enabled).toBe(true)
    expect(getAnalyticsSettings({ VITE_ANALYTICS_ENABLED: 'true', VITE_ANALYTICS_QA: 'true' }, 'localhost').environment).toBe('qa')
  })
  const click = { element_id: 'hero_nature', placement: 'home_hero', service: 'nature', destination_path: '/naturaleza' }
  it('accepts a registered action without sending anything', () => {
    expect(validateAnalyticsEvent('cta_click', click)).toBe(true)
    expect(Object.keys(ANALYTICS_EVENTS)).toHaveLength(24)
    expect(Object.keys(LEGACY_ANALYTICS_EVENTS)).toHaveLength(6)
  })
  it.each([
    { ...click, email: 'person@example.invalid' }, { ...click, event_id: 'caller-id' },
    { ...click, destination_path: '/naturaleza?email=person' }, { ...click, destination_path: '/#naturaleza' },
    { ...click, placement: 'person@example.invalid' }, { ...click, element_id: 'a-phone-56912345678' },
    { ...click, service: 'clinical_diagnosis' }, { ...click, destination_path: 'https://external.invalid' },
    {}, null, [],
  ])('rejects unknown, sensitive or incomplete data: %j', (params) => {
    expect(validateAnalyticsEvent('cta_click', params)).toBe(false)
  })
  it('rejects unknown event names including object prototype properties', () => {
    for (const name of ['purchase', 'email', '__proto__', 'constructor']) expect(validateAnalyticsEvent(name, {})).toBe(false)
  })
  it('permits only catalog titles and clean known URLs', () => {
    const params = { page_title: 'Cursos y formación | Nicolás Zamara', page_location: 'https://www.nicolaszamara.com/cursos', page_referrer: '' }
    expect(validateAnalyticsEvent('page_view', params)).toBe(true)
    for (const page_location of ['https://www.nicolaszamara.com/cursos?name=Ana', 'https://www.nicolaszamara.com/custom-person', 'https://user@www.nicolaszamara.com/cursos', 'http://www.nicolaszamara.com/cursos']) {
      expect(validateAnalyticsEvent('page_view', { ...params, page_location })).toBe(false)
    }
    expect(validateAnalyticsEvent('page_view', { ...params, page_title: 'Ana personal message' })).toBe(false)
  })
  it('accepts lead enums but never a remote request ID or form contents', () => {
    const params = { form_kind: 'chat_contact', placement: 'floating_chat_form', service: 'general', lead_source: 'chatbot' }
    expect(validateAnalyticsEvent('generate_lead', params)).toBe(true)
    expect(validateAnalyticsEvent('generate_lead', { ...params, request_id: 'remote' })).toBe(false)
    expect(validateAnalyticsEvent('generate_lead', { ...params, values: { name: 'Ana' } })).toBe(false)
  })
  it('does not accept experiments until exact IDs are registered', () => {
    expect(validateAnalyticsEvent('experiment_exposure', { experiment_id: 'test', variant_id: 'a' })).toBe(false)
  })
})
