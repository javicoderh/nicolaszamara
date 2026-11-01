import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { SITE_ORIGIN, SITE_ROUTES } from '../src/config/siteRoutes.js'
import { htmlWithSeo, sitemapXml } from '../src/services/seoService.js'

const output = resolve('dist')
const template = await readFile(join(output, 'index.html'), 'utf8')
// Production indexation requires an explicit opt-in as well as Vercel's real
// deployment environment. A local or preview build never turns it on by hostname.
const indexingEnabled = process.env.VERCEL_ENV === 'production' && process.env.SEO_ALLOW_INDEXING === 'true'
for (const { path } of SITE_ROUTES) {
  const directory = path === '/' ? output : join(output, path.slice(1))
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'index.html'), htmlWithSeo(template, path, { indexingEnabled }))
}
await writeFile(join(output, '404.html'), htmlWithSeo(template, '/404', { indexingEnabled: false }))
await writeFile(join(output, 'sitemap.xml'), sitemapXml(indexingEnabled))
await writeFile(join(output, 'robots.txt'), `User-agent: *\nAllow: /\n${indexingEnabled ? `Sitemap: ${SITE_ORIGIN}/sitemap.xml\n` : ''}`)
console.log(`SEO: ${SITE_ROUTES.length} routes generated; indexing ${indexingEnabled ? 'enabled' : 'disabled'}.`)
