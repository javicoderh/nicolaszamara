// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { handleBlog } from './blog-handler.js'
function response() { return { setHeader: vi.fn(), end: vi.fn() } }
it('returns origin failures as 503', async () => {
  const res = response()
  await handleBlog({ method: 'GET', url: '/blog' }, res, { read: async () => { throw new Error() } })
  expect(res.statusCode).toBe(503)
})
it('ships escaped snapshot and unique SEO title', async () => {
  const res = response(), article = { slug: 'un-bosque', title: '</script>Lectura', summary: 'Resumen', author: 'Equipo', category: 'naturaleza' }
  await handleBlog({ method: 'GET', url: '/blog/un-bosque' }, res, { read: async () => ({ status: 'ready', article }), render: () => '<article>Lectura</article>',
    template: '<html><head><title>Anterior</title></head><body><div id="root"></div></body></html>' })
  const html = res.end.mock.calls[0][0]
  expect(html.match(/<title>/g)).toHaveLength(1)
  expect(html).toContain('<article>Lectura</article>')
  expect(html).toContain('\\u003c/script>Lectura')
  expect(res.statusCode).toBe(200)
})
it('redirects former slugs', async () => {
  const res = response()
  await handleBlog({ method: 'GET', url: '/blog/old' }, res, { read: async () => ({ status: 'redirect', slug: 'new' }) })
  expect(res.statusCode).toBe(301)
  expect(res.setHeader).toHaveBeenCalledWith('Location', '/blog/new')
})
it('keeps drafts and archived articles at 404',async()=>{
 const res=response();await handleBlog({method:'GET',url:'/blog/private-draft'},res,{read:async()=>({status:'not_found'}),render:()=>'<main>No disponible</main>',template:'<html><head></head><body><div id="root"></div></body></html>'})
 expect(res.statusCode).toBe(404);expect(res.end.mock.calls[0][0]).not.toContain('private content')
})
it('rejects invalid pagination before reading the database',async()=>{
 const res=response(),read=vi.fn();await handleBlog({method:'GET',url:'/blog?page=2.5'},res,{read});expect(res.statusCode).toBe(400);expect(read).not.toHaveBeenCalled()
})
it('gives filtered pages their own canonical and followable noindex policy',async()=>{
 const previousEnv={...process.env};process.env.VERCEL_ENV='production';process.env.SEO_ALLOW_INDEXING='true'
 try{const res=response();await handleBlog({method:'GET',url:'/blog?category=naturaleza&page=2'},res,{read:async()=>({status:'ready',items:[],total:0}),render:()=>'<main>Blog</main>',template:'<html><head><title>Anterior</title><link rel="canonical" href="https://old.example"><meta name="robots" content="index"></head><body><div id="root"></div></body></html>'});const html=res.end.mock.calls[0][0];expect(html).toContain('https://www.nicolaszamara.com/blog?category=naturaleza&amp;page=2');expect(html).toContain('noindex,follow');expect(html.match(/rel="canonical"/g)).toHaveLength(1)}finally{process.env=previousEnv}
})
