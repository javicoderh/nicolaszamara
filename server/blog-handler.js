import { readFile } from 'node:fs/promises'
import { renderSeoHead } from '../src/services/seoService.js'
import { articleMetadata,listingMetadata } from '../src/services/blogSeo.js'
import { htmlWithSeo } from '../src/services/seoService.js'

const origin = 'https://www.nicolaszamara.com'
const publicKey = 'sb_publishable_Xy6M7bnKUS5FOfL4yLHA-w_4OgENEGD'
export async function publicBlog(query, request = fetch, name = 'blog_read') {
  const response = await request(`${process.env.SUPABASE_URL || 'https://vsbolndzzkrhadprdlto.supabase.co'}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY || publicKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(query), signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error('unavailable')
  return response.json()
}
export async function handleBlog(req, res, dependencies = {}) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.statusCode = 405; return res.end() }
  const url = new URL(req.url, origin)
  const path = url.searchParams.get('path') || url.pathname
  if(!['/api/blog','/blog','/blog-sitemap.xml'].includes(path)&&!/^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)){res.statusCode=404;return res.end('Artículo no encontrado')}
  const slug = url.searchParams.get('slug') || (path.startsWith('/blog/') ? path.slice(6) : null)
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { res.statusCode = 404; return res.end('Artículo no encontrado') }
  try {
    const page=Number(url.searchParams.get('page')||1),category=url.searchParams.get('category')||null
    if(!Number.isInteger(page)||page<1||page>10000||(category&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category))){res.statusCode=400;return res.end('Parámetros no válidos')}
    if (path === '/api/blog' && ['catalog', 'related'].includes(url.searchParams.get('mode'))) {
      const catalog = url.searchParams.get('mode') === 'catalog'
      const result = await publicBlog(catalog ? {} : { p_slug: slug }, fetch, catalog ? 'blog_catalog' : 'blog_related')
      res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(result))
    }
    if (path === '/blog-sitemap.xml') {
      const enabled = process.env.VERCEL_ENV === 'production' && process.env.SEO_ALLOW_INDEXING === 'true'
      const data = enabled ? await publicBlog({}, fetch, 'blog_sitemap') : { items: [] }
      const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + data.items.map((item) => `<url><loc>${origin}/blog/${item.slug}</loc><lastmod>${item.updatedAt}</lastmod></url>`).join('') + '</urlset>'
      res.setHeader('Content-Type', 'application/xml'); return res.end(req.method === 'HEAD' ? '' : xml)
    }
    const result = await (dependencies.read || publicBlog)({ p_slug: slug, p_category: url.searchParams.get('category') || null, p_page: Number(url.searchParams.get('page') || 1) })
    if (path === '/api/blog') { res.statusCode = result.status === 'not_found' ? 404 : result.status === 'invalid' ? 400 : 200; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(result)) }
    if (result.status === 'redirect') { res.statusCode = 301; res.setHeader('Location', `/blog/${result.slug}`); return res.end() }
    res.statusCode = result.status === 'not_found' ? 404 : result.status === 'invalid' ? 400 : 200
    const enabled = process.env.VERCEL_ENV === 'production' && process.env.SEO_ALLOW_INDEXING === 'true'
    const snapshot = { ...result, path, search: url.searchParams.has('category') || url.searchParams.has('page') ? '?' + [...url.searchParams].filter(([key]) => ['category', 'page'].includes(key)).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&') : '' }
    const render = dependencies.render || (await import('./generated/entry-server.js')).renderRoute
    let template = dependencies.template || await readFile(new URL('./generated/template.html', import.meta.url), 'utf8')
    template=htmlWithSeo(template,'/blog',{indexingEnabled:enabled,metadata:result.article?articleMetadata(result.article,enabled):listingMetadata(snapshot.search,enabled&&result.status==='ready')})
    const html = template.replace('<div id="root"></div>', () => `<div id="root">${render(path, snapshot)}</div>`)
      .replace('</body>', () => `<script id="blog-snapshot" type="application/json">${JSON.stringify(snapshot).replace(/</g, '\\u003c')}</script></body>`)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(req.method === 'HEAD' ? '' : html)
  } catch {
    res.statusCode = 503; res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end('<!doctype html><html lang="es"><meta name="robots" content="noindex"><title>Lecturas temporalmente no disponibles</title><h1>No pudimos cargar las lecturas.</h1><p>Vuelve a intentarlo en un momento.</p></html>')
  }
}
