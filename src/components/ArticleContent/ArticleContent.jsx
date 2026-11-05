import protocol from '../../../config/blog/protocol.json'
import { Fragment } from 'react'
import { articleImagePlacement, articleTextFlow } from '../../services/articleImageLayout.js'
import { editorialMediaUrl,editorialSrcSet } from '../../services/blogMediaService.js'
import './ArticleContent.css'
import { trackEvent } from '../../services/analyticsService.js'

export function prose(text = '') {
  return text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((part,index)=>part.startsWith('**')&&part.endsWith('**')?<strong key={index}>{part.slice(2,-2)}</strong>:part.startsWith('_')&&part.endsWith('_')?<em key={index}>{part.slice(1,-1)}</em>:part)
}
export default function ArticleContent({ article, privateMedia = false, related, engagement }) {
  const mediaSrc = (value) => editorialMediaUrl(value, privateMedia)
  const bodyImage = article.bodyImage
  const blocks = articleTextFlow(article.document?.blocks || [], Boolean(bodyImage?.src))
  const imagePosition = articleImagePlacement(blocks, bodyImage||{})
  function renderBlock(block, index) {
    switch (block.type) {
      case 'paragraph': return <p data-article-block={index}>{prose(block.text)}</p>
      case 'heading': return block.level === 3 ? <h3 data-article-block={index}>{block.text}</h3> : <h2 data-article-block={index}>{block.text}</h2>
      case 'quote': return <blockquote data-article-block={index}>{prose(block.text)}</blockquote>
      case 'separator': return <hr data-article-block={index} />
      case 'list': { const List = block.ordered ? 'ol' : 'ul'; return <List data-article-block={index}>{block.items.map((item, i) => <li key={i}>{item}</li>)}</List> }
      case 'link': return /^(https:\/\/|\/(?!\/))/.test(block.href) ? <p data-article-block={index}><a href={block.href}>{block.text} ↗</a></p> : null
      default: return null
    }
  }
  return <article className="article-content">
    <header><p className="article-content__category">{article.categoryLabel || protocol.categories[article.category]}</p><h1>{article.title}</h1><p className="article-content__summary">{article.summary}</p>
      <p className="article-content__meta">{article.author} · {article.readingMinutes || 1} min de lectura{article.publishedAt && ` · ${new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: 'America/Santiago' }).format(new Date(article.publishedAt))}`}</p></header>
    {article.cover && <figure className="article-content__cover-frame"><img className="article-content__cover" style={{objectPosition:`${article.coverPosition?.x??50}% ${article.coverPosition?.y??50}%`}} src={mediaSrc(article.cover)} srcSet={editorialSrcSet(article.cover,privateMedia)} sizes="(max-width: 1040px) 100vw, 1040px" alt={article.coverAlt || ''} width="1200" height="800" fetchPriority="high" />{article.coverCaption && <figcaption>{article.coverCaption}</figcaption>}</figure>}
    {article.reels?.length > 0 && <aside className="article-content__reel"><p>Esta conversación comenzó en Instagram.</p>{article.reels.map((href, i) => <a key={href} href={href} target="_blank" rel="noopener noreferrer" onClick={()=>{if(!privateMedia)trackEvent('blog_reel',{article_id:article.id})}}>{article.reelDetails?.find(item=>item.url===href)?.label || (i===0?'Ver el reel principal':`Ver reel ${i+1}`)} ↗</a>)}</aside>}
    <div className="article-content__body">{blocks.map((block, index) => <Fragment key={`${index}-${block.type}`}>
      {renderBlock(block, index)}
      {bodyImage?.src && index === imagePosition && <figure className={`article-content__interior article-content__interior--${bodyImage.alignment === 'left' ? 'left' : 'right'}`}>
        <img style={{objectPosition:`${bodyImage.position?.x??50}% ${bodyImage.position?.y??50}%`}} src={mediaSrc(bodyImage.src)} srcSet={editorialSrcSet(bodyImage.src,privateMedia)} sizes="(max-width:640px) calc(100vw - 40px), 320px" alt={bodyImage.alt || ''} loading="lazy" decoding="async" width="640" height="800" />
        {bodyImage.caption && <figcaption>{bodyImage.caption}</figcaption>}
      </figure>}
    </Fragment>)}</div>
    {article.sources?.length > 0 && <section className="article-content__sources"><h2>Fuentes para profundizar</h2><ol>{article.sources.map((href, i) => <li key={href}><a href={href} target="_blank" rel="noopener noreferrer">{article.sourceDetails?.find(item=>item.url===href)?.title || `Fuente ${i+1}: ${new URL(href).hostname}`} ↗</a></li>)}</ol></section>}
    {(article.authorBio||article.reviewer)&&<aside className="article-content__credits">{article.authorBio&&<p>{article.authorBio}</p>}{article.reviewer&&<p>Revisión editorial: {article.reviewer}{article.reviewedAt&&` · ${article.reviewedAt}`}</p>}</aside>}
    {related}
    {article.relatedServiceId && protocol.services[article.relatedServiceId] && <footer><h2>Sigamos explorando</h2><a href={protocol.services[article.relatedServiceId]} onClick={()=>{if(!privateMedia)trackEvent('blog_cta',{article_id:article.id})}}>Conocer más sobre este servicio →</a></footer>}
    {engagement}
  </article>
}
