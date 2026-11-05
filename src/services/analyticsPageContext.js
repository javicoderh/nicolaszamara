import { pageMetadata } from '../content/siteContent.js'

const canonicalOrigin = 'https://www.nicolaszamara.com'
const pageTypes = { '/': 'home', '/consulta': 'consultation', '/terapias': 'therapies', '/cursos': 'courses',
  '/naturaleza': 'nature', '/sobre-mi': 'about', '/chatbot': 'chatbot', '/privacidad': 'privacy', '/blog':'blog' }
const referrerHosts = ['www.google.com', 'www.google.cl', 'www.bing.com', 'www.instagram.com', 'www.facebook.com']

export function cleanReferrer(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return ''
    if (['www.nicolaszamara.com', 'nicolaszamara.com'].includes(url.hostname)) {
      const path = url.pathname.replace(/\/+$/, '') || '/'
      return Object.hasOwn(pageTypes, path) ? `${canonicalOrigin}${path}` : ''
    }
    return referrerHosts.includes(url.hostname) ? `${url.origin}/` : ''
  } catch { return '' }
}

export function createPageContext(pathname, referrer = '') {
  const rawPath = typeof pathname === 'string' ? pathname.replace(/\/+$/, '') || '/' : '/404'
  // Send no free-form slug/title; article attribution uses the validated UUID.
  const path = /^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawPath) ? '/blog' : rawPath
  const known = Object.hasOwn(pageTypes, path)
  const page_path = known ? path : '/404'
  return Object.freeze({ page_path, page_type: known ? pageTypes[path] : 'not_found',
    page_title: known ? pageMetadata[path].title : 'Página no encontrada | Nicolás Zamara',
    page_location: `${canonicalOrigin}${page_path}`, page_referrer: cleanReferrer(referrer) })
}
