import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BASE_DELAY_MS } from '../../config/loading.js'
import { readBlog } from '../../services/blogService.js'
import ArticleContent from '../../components/ArticleContent/ArticleContent.jsx'
import ArticleContentSkeleton from '../../components/ArticleContent/ArticleContentSkeleton.jsx'
import BlogPageSkeleton from './BlogPageSkeleton.jsx'
import protocol from '../../../config/blog/protocol.json'
import { articleMetadata,listingMetadata } from '../../services/blogSeo.js'
import { applyMetadata } from '../../services/seoService.js'
import './BlogPage.css'
import ReadingProgress from '../../components/ReadingProgress/ReadingProgress.jsx'
import RelatedArticles from '../../components/RelatedArticles/RelatedArticles.jsx'
import BlogCategoryFilter from '../../components/BlogCategoryFilter/BlogCategoryFilter.jsx'
import { useAnalyticsConsent } from '../../contexts/AnalyticsConsentContext/AnalyticsConsentContext.jsx'
import { trackEvent } from '../../services/analyticsService.js'
import { SITE_ORIGIN } from '../../config/siteRoutes.js'
import { editorialSrcSet } from '../../services/blogMediaService.js'
import SavedArticles from '../../components/SavedArticles/SavedArticles.jsx'
import ArticleEngagement from '../../components/ArticleEngagement/ArticleEngagement.jsx'

function navigate(href, state) { window.history.pushState(state, '', href); window.dispatchEvent(new PopStateEvent('popstate')) }
export default function BlogPage({ location, initialBlog }) {
  const path = location?.pathname || '/blog'
  const search = location?.search || ''
  const slug = path.startsWith('/blog/') ? path.slice(6) : null
  const modal = Boolean(slug && location?.state?.blogBackground)
  const backgroundSearch=modal?new URL(location.state.blogBackground,'https://www.nicolaszamara.com').search:search
  const params = new URLSearchParams(backgroundSearch)
  const category = params.get('category') || ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const preferences=useAnalyticsConsent()
  const viewSent=useRef(null)
  const [list, setList] = useState(() => !slug ? initialBlog : null)
  const listSearch = useRef(!slug && initialBlog ? search : null)
  const [article, setArticle] = useState(() => slug ? initialBlog : null)
  const [pending, setPending] = useState(!initialBlog)
  const [revision, setRevision] = useState(0)
  const [notice, setNotice] = useState('')
  const dialog = useRef(null)
  const origin = useRef(null)
  const background = useRef(null)
  const [exiting, setExiting] = useState(false)
  const closeTimer = useRef(null)
  const revealed = useRef(false)
  useEffect(() => { clearTimeout(closeTimer.current); setExiting(false) }, [path])
  useEffect(() => () => clearTimeout(closeTimer.current), [])
  useEffect(()=>{const invalidate=()=>{listSearch.current=null;setRevision(n=>n+1)};window.addEventListener('nz-blog-updated',invalidate);return()=>window.removeEventListener('nz-blog-updated',invalidate)},[])

  useEffect(() => {
    if (!slug && revealed.current && list && listSearch.current === search && revision === 0) { setPending(false); return }
    const controller = new AbortController()
    let active = true, timer
    setPending(true); setNotice('')
    const snapshot = initialBlog && initialBlog.path === path && (initialBlog.search || '') === search
    const load = snapshot ? Promise.resolve(initialBlog) : readBlog({ slug, category, page }, controller.signal)
    load.catch(() => ({ status: 'unavailable' })).then((result) => {
      if (!active) return
      timer = setTimeout(() => {
        if (!active) return
        if (result.status === 'redirect') { window.location.replace(`/blog/${result.slug}`); return }
        if (slug) setArticle(result); else { setList(result); listSearch.current = search }
        setPending(false); revealed.current = true
      }, BASE_DELAY_MS)
    })
    return () => { active = false; controller.abort(); clearTimeout(timer) }
  }, [path, search, revision])

  useEffect(() => {
    if (!modal || !dialog.current) return
    const current = dialog.current
    const focused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    current.showModal()
    return () => {
      current.close(); document.body.style.overflow = previousOverflow
      const restore = origin.current || focused
      if (restore?.isConnected) restore.focus({ preventScroll: true }); else background.current?.querySelector('h1')?.focus({ preventScroll: true })
      window.scrollTo({ top: location.state?.scroll || 0, behavior: 'instant' })
    }
  }, [modal])

  useEffect(() => {
    const content = article?.article
    const enabled = document.querySelector('meta[name="site-indexing-enabled"]')?.content === 'true'
      && ['www.nicolaszamara.com', 'nicolaszamara.com'].includes(window.location.hostname)
    if (!slug) {applyMetadata(document,listingMetadata(search,enabled),enabled);return}
    if(!content||pending)return
    applyMetadata(document, articleMetadata(content, enabled), enabled)
    if(viewSent.current!==content.id&&trackEvent('blog_article_view',{article_id:content.id}))viewSent.current=content.id
  }, [slug, article, search, pending,preferences?.consent])

  function open(event, item) {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault(); origin.current = event.currentTarget
    navigate(`/blog/${item.slug}`, { blogBackground: `/blog${search}`, blogDepth: 1, scroll: window.scrollY })
  }
  function openRelated(event,item){if(!modal||event.button||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate(`/blog/${item.slug}`,{...location.state,blogDepth:(location.state.blogDepth||1)+1});dialog.current?.scrollTo({top:0})}
  function close() {
    if (exiting) return
    const finish = () => { setExiting(false); if (location.state?.blogBackground && location.state?.blogDepth) window.history.go(-location.state.blogDepth); else navigate('/blog') }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) finish()
    else { setExiting(true); closeTimer.current = setTimeout(finish, 180) }
  }
  function filter(value, nextPage = 1) {
    trackEvent('blog_filter',{category:value?(Object.hasOwn(protocol.categories,value)?value:'other'):'all'})
    const next = new URLSearchParams()
    if (value) next.set('category', value)
    if (nextPage > 1) next.set('page', String(nextPage))
    navigate(`/blog${next.size ? `?${next}` : ''}`)
  }
  function pageHref(nextPage){const query=new URLSearchParams();if(category)query.set('category',category);if(nextPage>1)query.set('page',String(nextPage));return `/blog${query.size?'?'+query:''}`}
  function pageClick(event,nextPage){if(event.button||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();filter(category,nextPage)}
  async function share() {
    const href = `${SITE_ORIGIN}/blog/${slug}`
    try {
      if (navigator.share) await navigator.share({ title: article?.article?.title, url: href })
      else { await navigator.clipboard.writeText(href); setNotice('Enlace copiado.') }
      trackEvent('blog_share',{article_id:article?.article?.id})
    } catch (error) { if (error.name !== 'AbortError') setNotice('No pudimos compartir el enlace. Puedes copiar la dirección del navegador.') }
  }
  const cards = list?.items || []
  const featured = !category && page === 1 ? cards.find((item) => item.featured) || cards[0] : null
  const reader = <>
    <ReadingProgress articleId={article?.article?.id} ready={!pending && article?.status === 'ready'} rootRef={modal ? dialog : undefined}/>
    <div className="blog-reader__toolbar"><a href="/blog" onClick={modal ? (e) => { e.preventDefault(); close() } : undefined}>{modal ? 'Cerrar lectura ×' : '← Volver al blog'}</a><button type="button" onClick={share}>Compartir ↗</button></div>
    <SavedArticles onOpen={modal?openRelated:undefined}/>
    {notice && <p role="status" className="page-wrap">{notice}</p>}
    {pending ? <ArticleContentSkeleton /> : article?.status === 'ready' ? <ArticleContent article={article.article} engagement={<ArticleEngagement article={article.article}/>} related={<RelatedArticles slug={slug} onOpen={modal ? (event,item)=>{if(event.button||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate(`/blog/${item.slug}`,{...location.state,blogDepth:(location.state.blogDepth||1)+1});dialog.current?.scrollTo({top:0})}:undefined}/>} /> : <div className="blog-state" role="status"><h1>{article?.status === 'not_found' ? 'Este artículo no está disponible.' : 'No pudimos cargar la lectura.'}</h1><button onClick={() => setRevision((n) => n + 1)}>Reintentar</button><a href="/blog">Explorar el blog</a></div>}
  </>
  if (slug && !modal) return <main id="main-content" className="blog-reader blog-reader--page">{reader}</main>
  return <>
    <main ref={background} id="main-content" className="blog-page page-wrap" aria-hidden={modal ? true : undefined}>
      <header className="blog-page__intro"><span className="blog-page__eyebrow">Blog · Nicolás Zamara</span><h1 tabIndex={-1}>Para profundizar</h1><p>Hay temas que merecen un poco más de tiempo. Continuemos las conversaciones que comienzan entre la consulta, el aprendizaje y la naturaleza.</p><span className="blog-page__ornament" aria-hidden="true">✧</span></header>
      <BlogCategoryFilter selected={category} onSelect={filter}/>
      <SavedArticles onOpen={open}/>
      {pending && !modal ? <BlogPageSkeleton /> : list?.status === 'unavailable' ? <div className="blog-state" role="alert"><p>No pudimos cargar los artículos.</p><button onClick={() => setRevision((n) => n + 1)}>Reintentar</button></div> : !cards.length ? <div className="blog-state"><h2>Estamos preparando nuevas lecturas.</h2><p>Pronto encontrarás aquí ideas para seguir explorando.</p></div> : <>
        {featured && <a href={`/blog/${featured.slug}`} onClick={(event) => open(event, featured)} className="blog-featured">{featured.cover && <img src={featured.cover} srcSet={editorialSrcSet(featured.cover)} sizes="(max-width:640px) calc(100vw - 40px), 60vw" alt={featured.coverAlt || ''} width="1200" height="900" />}<div><span className="blog-page__eyebrow">Lectura destacada · {featured.categoryLabel || protocol.categories[featured.category]}</span><h2>{featured.title}</h2><p>{featured.summary}</p><span>{featured.readingMinutes} min de lectura · Abrir artículo ↗</span></div></a>}
        <section className="blog-grid" aria-label="Artículos">{cards.filter((item) => item.id !== featured?.id).map((item) => <a className="blog-card" href={`/blog/${item.slug}`} key={item.id} onClick={(event) => open(event, item)}>{item.cover && <div className="blog-card__image"><img src={item.cover} srcSet={editorialSrcSet(item.cover)} sizes="(max-width:640px) calc(100vw - 40px), (max-width:1023px) 50vw, 33vw" alt={item.coverAlt || ''} width="960" height="720" loading="lazy" /></div>}<div><span className="blog-page__eyebrow">{item.categoryLabel || protocol.categories[item.category]}</span><h2>{item.title}</h2><p>{item.summary}</p><span>{item.reels?.length > 0 && 'Desde Instagram '}{item.readingMinutes} min de lectura ↗</span></div></a>)}</section>
        <nav className="blog-pagination" aria-label="Paginación del blog">{page>1?<a href={pageHref(page-1)} onClick={event=>pageClick(event,page-1)}>Anterior</a>:<span aria-disabled="true">Anterior</span>}<span>Página {page}</span>{page*12<(list?.total||0)?<a href={pageHref(page+1)} onClick={event=>pageClick(event,page+1)}>Siguiente</a>:<span aria-disabled="true">Siguiente</span>}</nav>
      </>}
    </main>
    {modal && createPortal(<dialog ref={dialog} className={`blog-reader blog-reader--modal${exiting ? ' blog-reader--exiting' : ''}`} aria-label="Lectura del artículo" onCancel={(event) => { event.preventDefault(); close() }} onClick={(event) => { if (event.target === event.currentTarget) close() }}>{reader}</dialog>, document.body)}
  </>
}
