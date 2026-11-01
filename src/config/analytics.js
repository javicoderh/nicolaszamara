import { pageMetadata } from '../content/siteContent.js'

export const ANALYTICS_SCHEMA_VERSION = 1
export const SITE_VERSION = 'marketing-baseline-v1'
export const ANALYTICS_QUEUE_LIMIT = 50
export const ANALYTICS_QUEUE_TTL_MS = 30000

export function getAnalyticsSettings(env = import.meta.env, hostname = typeof window === 'undefined' ? '' : window.location.hostname) {
  const qa = env.VITE_ANALYTICS_QA === 'true'
  const production = env.MODE === 'production' && ['www.nicolaszamara.com', 'nicolaszamara.com'].includes(hostname)
  return Object.freeze({
    enabled: env.VITE_ANALYTICS_ENABLED === 'true' && (qa || production),
    environment: qa ? 'qa' : production ? 'production' : 'development',
    ga4Id: /^G-[A-Z0-9]+$/.test(env.VITE_GA4_MEASUREMENT_ID || '') ? env.VITE_GA4_MEASUREMENT_ID : '',
    clarityId: /^[a-z0-9]+$/.test(env.VITE_CLARITY_PROJECT_ID || '') ? env.VITE_CLARITY_PROJECT_ID : '',
    siteVersion: SITE_VERSION,
  })
}

const member = (values) => (value) => typeof value === 'string' && values.includes(value)
const routePaths = [...Object.keys(pageMetadata).filter((path) => path !== '/admin'), '/404']
const route = member(routePaths)
const service = member(['consultation', 'therapies', 'course', 'online', 'nature', 'about', 'general'])
const formKind = member(['consultation', 'online', 'nature', 'chat_contact'])
const errorCode = member(['required', 'format', 'too_long', 'consent_required', 'rate_limited', 'timeout', 'network', 'unavailable'])
const fieldId = member(['name', 'email', 'phone', 'contact_preference', 'city', 'country', 'privacy_consent', 'form'])

export const ANALYTICS_SECTIONS = Object.freeze([
  'home_hero', 'home_areas', 'home_consultation', 'home_course', 'home_about', 'home_nature', 'home_nature_form',
  'consultation_intro', 'consultation_steps', 'consultation_details', 'consultation_faq', 'consultation_form', 'consultation_contact',
  'therapies_intro', 'therapies_grid', 'courses_intro', 'courses_offer', 'courses_online_form',
  'nature_intro', 'nature_page_form', 'about_bio',
])

export const ANALYTICS_PLACEMENTS = Object.freeze([
  'header', 'footer', 'home_hero', 'home_areas', 'home_consultation', 'home_course', 'home_nature', 'home_nature_form',
  'consultation_contact', 'consultation_form', 'therapies_grid', 'courses_offer', 'courses_online_form',
  'nature_intro', 'nature_page_form', 'floating_contact', 'floating_chat', 'embedded_chat',
  'floating_chat_form', 'embedded_chat_form',
])

const destinations = ['home', 'therapies', 'consultation', 'courses', 'nature', 'about', 'privacy', 'online', 'availability', 'steps', 'nature_interest']
const therapies = ['acupuntura', 'moxibustion', 'ventosaterapia', 'tuina', 'flores-de-bach', 'medicina-bioenergetica', 'iridologia', 'meditacion-y-mindfulness']
export const ANALYTICS_ELEMENTS = Object.freeze([
  ...['home', 'therapies', 'consultation', 'courses', 'nature', 'about'].map((id) => `nav_${id}`),
  ...destinations.map((id) => `footer_${id}`),
  ...destinations.map((id) => `chat_${id}`),
  ...therapies.map((id) => `therapy_${id}_consultation`),
  ...['consultation', 'courses', 'nature'].flatMap((id) => [`area_${id}_visual`, `area_${id}_text`]),
  'brand_home', 'header_consultation', 'hero_consultation', 'hero_courses', 'hero_nature',
  'home_consultation_details', 'home_course_hotmart', 'home_course_online', 'home_nature_interest',
  'consultation_whatsapp', 'courses_hotmart', 'courses_online_interest', 'nature_interest',
  'floating_whatsapp', 'floating_chatbot', 'chat_hotmart',
  'therapies_consultation',
])

const placement = member(ANALYTICS_PLACEMENTS)
const elementId = member(ANALYTICS_ELEMENTS)
const internalHosts = ['www.nicolaszamara.com', 'nicolaszamara.com']
const referrerHosts = ['www.google.com', 'www.google.cl', 'www.bing.com', 'www.instagram.com', 'www.facebook.com']

function safeLocation(value, referrer = false) {
  if (referrer && value === '') return true
  if (typeof value !== 'string' || value.length > 254) return false
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash) return false
    return internalHosts.includes(url.hostname)
      ? route(url.pathname)
      : referrer && referrerHosts.includes(url.hostname) && url.pathname === '/'
  } catch { return false }
}

const cta = { element_id: elementId, placement, service }
const form = { form_kind: formKind, placement }
const eventDefinitions = {
  page_view: { page_title: member([...Object.entries(pageMetadata).filter(([path]) => path !== '/admin').map(([, { title }]) => title), 'Página no encontrada | Nicolás Zamara']), page_location: safeLocation, page_referrer: (value) => safeLocation(value, true) },
  section_view: { section_id: member(ANALYTICS_SECTIONS) },
  cta_view: cta,
  cta_click: { ...cta, destination_path: route },
  navigation_click: { element_id: elementId, placement, destination_path: route },
  whatsapp_click: cta,
  hotmart_click: { ...cta, source: member(['home', 'course', 'chatbot']) },
  form_start: form,
  form_validation_error: { ...form, error_code: errorCode, field_id: fieldId },
  form_submit_attempt: form,
  form_retry: { ...form, error_code: errorCode },
  form_submit_error: { ...form, error_code: errorCode },
  generate_lead: { ...form, service, lead_source: member(['form', 'chatbot']) },
  chatbot_open: { placement },
  chatbot_engaged: { placement },
  chat_contact_open: { placement },
  // No experiment is approved yet. Enabling one requires registering its exact IDs.
  experiment_exposure: { experiment_id: member([]), variant_id: member([]) },
}

export const ANALYTICS_EVENTS = Object.freeze(Object.fromEntries(
  Object.entries(eventDefinitions).map(([name, fields]) => [name, Object.freeze({ ...fields })]),
))

// This validates caller-owned fields only. Context/UUIDs are added by the emitter,
// never accepted from a control. No script or network request is made here.
export function validateAnalyticsEvent(name, params) {
  if (!Object.hasOwn(ANALYTICS_EVENTS, name) || !params || typeof params !== 'object' || Array.isArray(params)) return false
  const definition = ANALYTICS_EVENTS[name]
  if (Object.keys(params).length !== Object.keys(definition).length) return false
  return Object.keys(params).every((key) => Object.hasOwn(definition, key) && definition[key](params[key]))
}

export const LEGACY_ANALYTICS_EVENTS = Object.freeze({
  online_interest_saved: Object.freeze({ event_name: 'generate_lead', form_kind: 'online', service: 'online', lead_source: 'form' }),
  nature_interest_saved: Object.freeze({ event_name: 'generate_lead', form_kind: 'nature', service: 'nature', lead_source: 'form' }),
  consultation_interest_saved: Object.freeze({ event_name: 'generate_lead', form_kind: 'consultation', service: 'consultation', lead_source: 'form' }),
  chat_contact_saved: Object.freeze({ event_name: 'generate_lead', form_kind: 'chat_contact', lead_source: 'chatbot' }),
  hotmart_click: Object.freeze({ event_name: 'hotmart_click' }),
  whatsapp_click: Object.freeze({ event_name: 'whatsapp_click' }),
})
