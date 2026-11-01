import { expect, it } from 'vitest'
import { ctaAttributes, exposureFor, navigationParams } from './analyticsSensors.js'

it('only builds exposure metadata for registered IDs', () => {
  const params = { element_id: 'hero_nature', placement: 'home_hero', service: 'nature' }
  const element = document.createElement('a')
  Object.entries(ctaAttributes(params)).forEach(([key, value]) => element.setAttribute(key, value))
  expect(exposureFor(element)).toEqual({ name: 'cta_view', params })
  expect(ctaAttributes({ ...params, element_id: 'person@example.invalid' })).toEqual({})
  element.setAttribute('data-analytics-cta', '{"email":"private"}')
  expect(exposureFor(element)).toBeNull()
})
it('uses closed navigation targets and ignores unapproved destinations', () => {
  expect(navigationParams('/consulta#consult-contact-title', 'footer')).toEqual({ element_id: 'footer_availability', placement: 'footer', destination_path: '/consulta' })
  expect(navigationParams('https://external.invalid/private', 'footer')).toBeNull()
})
