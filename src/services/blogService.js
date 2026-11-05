export async function readBlog({ slug, category, page = 1, mode } = {}, signal) {
  const params = new URLSearchParams({ page: String(page) })
  if (slug) params.set('slug', slug)
  if (category) params.set('category', category)
  if (mode) params.set('mode', mode)
  const controller=new AbortController(),abort=()=>controller.abort()
  if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true})
  const timeout=setTimeout(abort,15000)
  try{
    const response = await fetch(`/api/blog?${params}`, { signal:controller.signal, cache: 'no-store' })
    const result = await response.json()
    if (!response.ok && result.status !== 'not_found') throw new Error(result.status || 'unavailable')
    return result
  }finally{clearTimeout(timeout);signal?.removeEventListener('abort',abort)}
}
