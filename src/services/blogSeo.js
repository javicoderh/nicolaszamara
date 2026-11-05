import { SITE_ORIGIN } from '../config/siteRoutes.js'
import { seoMetadata } from './seoService.js'
export function listingMetadata(search,enabled){
 const metadata=seoMetadata('/blog',{indexingEnabled:enabled}),params=new URLSearchParams(search),normalized=new URLSearchParams()
 const category=params.get('category'),page=Number(params.get('page')||1)
 if(category)normalized.set('category',category)
 if(Number.isInteger(page)&&page>1)normalized.set('page',String(page))
 return {...metadata,canonical:`${SITE_ORIGIN}/blog${normalized.size?'?'+normalized:''}`,robots:enabled?(normalized.size?'noindex,follow':'index,follow'):'noindex,nofollow'}
}
export function articleMetadata(article, enabled) {
  const canonical = `${SITE_ORIGIN}/blog/${article.slug}`
  return { title: article.seoTitle || `${article.title} | Nicolás Zamara`, description: article.metaDescription || article.summary,
    canonical, type: 'article', ogTitle: article.ogTitle, ogDescription: article.ogDescription, twitterCard:article.twitterCard,aiCrawlPolicy:article.aiCrawlPolicy,
    robots: enabled && article.crawlPolicy !== 'noindex' ? 'index,follow' : 'noindex,nofollow', image: article.ogImage || article.cover ? new URL(article.ogImage || article.cover, SITE_ORIGIN).href : `${SITE_ORIGIN}/photos/sobre-mi-maya-844-960.jpg`,
    structuredData: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'BlogPosting', headline: article.title, description: article.summary, image: article.cover ? new URL(article.cover,SITE_ORIGIN).href : undefined,
        author: { '@type': 'Person', name: article.author }, datePublished: article.publishedAt, dateModified: article.updatedAt, mainEntityOfPage: canonical },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Blog', item: `${SITE_ORIGIN}/blog` },
        { '@type': 'ListItem', position: 2, name: article.title, item: canonical },
      ] },
    ] } }
}
