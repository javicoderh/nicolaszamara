import { validateAnalyticsEvent } from '../config/analytics.js'

const navigationTargets = {
  '/': 'home', '/consulta': 'consultation', '/terapias': 'therapies', '/cursos': 'courses', '/naturaleza': 'nature',
  '/sobre-mi': 'about', '/privacidad': 'privacy', '/cursos#interes-online': 'online',
  '/consulta#consult-steps-title': 'steps', '/consulta#consult-contact-title': 'availability',
  '/naturaleza#interes-naturaleza': 'nature_interest', '/#interes-naturaleza': 'nature_interest',
}

export function navigationParams(href, placement) {
  const target = navigationTargets[href]
  const prefix = placement === 'header' ? 'nav' : placement === 'footer' ? 'footer' : 'chat'
  const params = { element_id: `${prefix}_${target}`, placement, destination_path: typeof href === 'string' ? href.split('#')[0] : '' }
  return target && validateAnalyticsEvent('navigation_click', params) ? params : null
}

export function ctaAttributes(params) {
  if (!params) return {}
  const value = { element_id: params.element_id, placement: params.placement, service: params.service }
  return validateAnalyticsEvent('cta_view', value) ? { 'data-analytics-cta': JSON.stringify(value) } : {}
}

export function exposureFor(element) {
  try {
    if (element.hasAttribute('data-analytics-section')) {
      const params = { section_id: element.getAttribute('data-analytics-section') }
      return validateAnalyticsEvent('section_view', params) ? { name: 'section_view', params } : null
    }
    const params = JSON.parse(element.getAttribute('data-analytics-cta'))
    return validateAnalyticsEvent('cta_view', params) ? { name: 'cta_view', params } : null
  } catch { return null }
}
