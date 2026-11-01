import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SITE_ROUTES } from '../src/config/siteRoutes.js'

const { renderRoute } = await import(pathToFileURL(resolve('.preview/marketing-ssr/entry-server.js')).href)
const output = resolve('dist')
for (const path of [...SITE_ROUTES.map((route) => route.path), '/404']) {
  const file = path === '/404' ? join(output, '404.html') : path === '/' ? join(output, 'index.html') : join(output, path.slice(1), 'index.html')
  const html = await readFile(file, 'utf8')
  const content = renderRoute(path)
  await writeFile(file, html.replace('<div id="root"></div>', () => `<div id="root">${content}</div>`))
}
console.log(`Prerender: ${SITE_ROUTES.length} routes and 404 contain server-rendered content; no external requests.`)
