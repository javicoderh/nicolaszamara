import { pageMetadata } from '../content/siteContent.js'

export const SITE_ORIGIN = 'https://www.nicolaszamara.com'
export const SITE_ROUTES = Object.freeze(Object.keys(pageMetadata).map((path) => Object.freeze({
  path, indexable: !['/chatbot', '/privacidad', '/admin'].includes(path),
})))

export function normalizeSitePath(path) {
  return typeof path === 'string' ? path.replace(/\/+$/, '') || '/' : '/404'
}
