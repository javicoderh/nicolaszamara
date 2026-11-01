import { describe, expect, it } from 'vitest'
import { seoMetadata, htmlWithSeo, renderSeoHead, sitemapXml, applySeoMetadata } from './seoService.js'

describe('SEO generation', () => {
  it('requires explicit indexing and excludes privacy, chatbot and unknown routes', () => {
    expect(seoMetadata('/consulta').robots).toBe('noindex,nofollow')
    expect(seoMetadata('/consulta/', { indexingEnabled: true }).robots).toBe('index,follow')
    for (const route of ['/privacidad', '/chatbot', '/admin', '/someone@example.invalid']) {
      expect(seoMetadata(route, { indexingEnabled: true }).robots).toBe('noindex,nofollow')
    }
    expect(seoMetadata('/someone@example.invalid').canonical).toBe('https://www.nicolaszamara.com/404')
  })
  it('generates one coherent head and escapes text/JSON-LD injection', () => {
    const template = '<html><head><title>Old</title><meta name="robots" content="noindex,nofollow"><meta property="og:title" content="Old"></head><body><div id="root"></div></body></html>'
    const html = htmlWithSeo(template, '/cursos', { indexingEnabled: true })
    const doc = new DOMParser().parseFromString(html, 'text/html')
    expect(doc.querySelectorAll('title')).toHaveLength(1)
    expect(doc.querySelectorAll('meta[name="robots"]')).toHaveLength(1)
    expect(doc.querySelector('meta[name="robots"]').content).toBe('index,follow')
    expect(doc.querySelector('link[rel="canonical"]').href).toBe('https://www.nicolaszamara.com/cursos')
    expect(doc.querySelector('meta[property="og:title"]').content).toBe(doc.title)
    const unsafe = renderSeoHead({ ...seoMetadata('/'), title: '"><img src=x>', structuredData: { text: '</script><script>alert(1)</script>' } })
    const parsed = new DOMParser().parseFromString(unsafe, 'text/html')
    expect(parsed.querySelector('img')).toBeNull()
    expect(parsed.querySelectorAll('script')).toHaveLength(1)
    expect(JSON.parse(parsed.querySelector('script').textContent).text).toContain('</script>')
  })
  it('includes only approved routes in the production sitemap without fabricated dates', () => {
    const sitemap = sitemapXml(true)
    expect(sitemap).toContain('https://www.nicolaszamara.com/consulta')
    expect(sitemap).not.toContain('/chatbot')
    expect(sitemap).not.toContain('/privacidad')
    expect(sitemap).not.toContain('/admin')
    expect(sitemap).not.toContain('lastmod')
    expect(sitemapXml(false)).not.toContain('<url>')
  })
  it('updates social tags and clears stale metadata on a 404 navigation', () => {
    const doc = document.implementation.createHTMLDocument('initial')
    applySeoMetadata(doc, '/consulta', true)
    applySeoMetadata(doc, '/cursos', true)
    expect(doc.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
    expect(doc.querySelector('meta[name="twitter:title"]').content).toBe(doc.title)
    applySeoMetadata(doc, '/unknown', true)
    expect(doc.title).toBe('Página no encontrada | Nicolás Zamara')
    expect(doc.querySelector('meta[name="robots"]').content).toBe('noindex,nofollow')
    expect(doc.querySelector('#site-structured-data')).toBeNull()
  })
})
