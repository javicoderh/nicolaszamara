import { useCallback } from 'react'
import { useAdminQuery } from '../../hooks/useAdminQuery/useAdminQuery.js'
import { readBlog } from '../../services/blogService.js'
import RelatedArticlesSkeleton from './RelatedArticlesSkeleton.jsx'
import './RelatedArticles.css'
import { trackEvent } from '../../services/analyticsService.js'
export default function RelatedArticles({ slug, onOpen }) {
  const load = useCallback(signal => readBlog({ slug, mode: 'related' }, signal), [slug])
  const query = useAdminQuery(load)
  return <section className="related-articles" aria-label="Lecturas relacionadas">{query.pending ? <RelatedArticlesSkeleton/> : query.error ? <div role="status"><p>No pudimos cargar otras lecturas.</p><button onClick={query.reload}>Reintentar relacionados</button></div> : query.data?.items?.length > 0 && <><h2>Para seguir explorando</h2>{query.data.items.filter(item=>item.slug!==slug).slice(0,3).map(item=><a key={item.slug} href={`/blog/${item.slug}`} onClick={event=>{trackEvent('blog_related',{article_id:item.id});onOpen?.(event,item)}}>{item.title} →</a>)}</>}</section>
}
