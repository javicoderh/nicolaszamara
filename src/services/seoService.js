import { pageMetadata, siteSettings } from '../content/siteContent.js'
import { SITE_ORIGIN, SITE_ROUTES, normalizeSitePath } from '../config/siteRoutes.js'

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

export function seoMetadata(path, { indexingEnabled = false } = {}) {
  const normalized = normalizeSitePath(path)
  const route = SITE_ROUTES.find((entry) => entry.path === normalized)
  const canonical = `${SITE_ORIGIN}${route ? normalized : '/404'}`
  const metadata = route ? pageMetadata[normalized] : { title: 'Página no encontrada | Nicolás Zamara', description: 'Encuentra los servicios y páginas de Nicolás Zamara.' }
  return { ...metadata, canonical, robots: indexingEnabled && route?.indexable ? 'index,follow' : 'noindex,nofollow',
    image: `${SITE_ORIGIN}/photos/sobre-mi-maya-844-960.jpg`,
    structuredData: route ? { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Person', '@id': `${SITE_ORIGIN}/#person`, name: siteSettings.brand, url: `${SITE_ORIGIN}/sobre-mi` },
      { '@type': 'WebSite', '@id': `${SITE_ORIGIN}/#website`, name: siteSettings.brand, url: `${SITE_ORIGIN}/` },
      { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: metadata.title, isPartOf: { '@id': `${SITE_ORIGIN}/#website` } },
    ] } : null }
}

export function renderSeoHead(metadata, indexingEnabled = false) {
  const tags = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `<meta name="description" content="${escapeHtml(metadata.description)}">`,
    `<meta name="robots" content="${metadata.robots}">`,
    `<meta name="site-indexing-enabled" content="${indexingEnabled ? 'true' : 'false'}">`,
    `<link rel="canonical" href="${escapeHtml(metadata.canonical)}">`,
    ...Object.entries({ 'og:type': metadata.type || 'website', 'og:title': metadata.ogTitle || metadata.title, 'og:description': metadata.ogDescription || metadata.description,
      'og:url': metadata.canonical, 'og:image': metadata.image }).map(([property, content]) => `<meta property="${property}" content="${escapeHtml(content)}">`),
    ...Object.entries({ 'twitter:card': metadata.twitterCard || 'summary_large_image', 'twitter:title': metadata.ogTitle || metadata.title,
      'twitter:description': metadata.description, 'twitter:image': metadata.image }).map(([name, content]) => `<meta name="${name}" content="${escapeHtml(content)}">`),
  ]
  if (metadata.aiCrawlPolicy === 'disallow') tags.push('<meta name="GPTBot" content="noindex, nofollow"><meta name="CCBot" content="noindex, nofollow">')
  if (metadata.structuredData) tags.push(`<script id="site-structured-data" type="application/ld+json">${JSON.stringify(metadata.structuredData).replace(/</g, '\\u003c')}</script>`)
  return tags.join('\n')
}

export function htmlWithSeo(template, path, options = {}) {
  const clean = template.replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*>/gi, (tag) => /(?:name|property)=["'](?:description|robots|site-indexing-enabled|og:[^"']+|twitter:[^"']+)["']/i.test(tag) ? '' : tag)
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<script\b[^>]*id=["']site-structured-data["'][^>]*>[\s\S]*?<\/script>/gi, '')
  return clean.replace('</head>', `${renderSeoHead(options.metadata || seoMetadata(path, options), options.indexingEnabled)}\n</head>`)
}

export function sitemapXml(indexingEnabled = false) {
  const urls = indexingEnabled ? SITE_ROUTES.filter((route) => route.indexable).map((route) => `<url><loc>${SITE_ORIGIN}${route.path}</loc></url>`).join('') : ''
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
}

export function applySeoMetadata(documentRef, path, indexingEnabled = false) {
  const metadata = seoMetadata(path, { indexingEnabled })
  applyMetadata(documentRef, metadata, indexingEnabled)
}

export function applyMetadata(documentRef, metadata, indexingEnabled = false) {
  documentRef.head.querySelectorAll('meta[name="GPTBot"],meta[name="CCBot"]').forEach(node=>node.remove())
  documentRef.title = metadata.title
  const tags = documentRef.createElement('template')
  tags.innerHTML = renderSeoHead(metadata, indexingEnabled)
  for (const node of [...tags.content.children]) {
    if (node.tagName === 'TITLE' || node.getAttribute('name') === 'site-indexing-enabled') continue
    const selector = node.id ? `#${node.id}` : node.tagName === 'LINK' ? 'link[rel="canonical"]'
      : node.hasAttribute('property') ? `meta[property="${node.getAttribute('property')}"]` : `meta[name="${node.getAttribute('name')}"]`
    documentRef.head.querySelector(selector)?.remove()
    documentRef.head.appendChild(node)
  }
  if (!metadata.structuredData) documentRef.head.querySelector('#site-structured-data')?.remove()
}
