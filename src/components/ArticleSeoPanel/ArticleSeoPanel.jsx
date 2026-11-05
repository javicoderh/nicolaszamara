import './ArticleSeoPanel.css'
export default function ArticleSeoPanel({ article, onChange }) {
  const title = article.seoTitle || article.title || 'Título del artículo'
  const description = article.metaDescription || article.summary || 'Resumen de la lectura'
  return <details className="article-seo-panel" open><summary>SEO y compartir</summary>
    {Object.entries({ focusKeyword:'Frase principal SEO',seoTitle:'Título SEO (opcional)',metaDescription:'Descripción SEO (opcional)',ogTitle:'Título al compartir (opcional)',ogDescription:'Descripción al compartir (opcional)' }).map(([name,label])=><label key={name}>{label}<input value={article[name] || ''} onChange={e=>onChange(name,e.target.value)} maxLength={name==='focusKeyword'?100:500}/></label>)}
    <p>{title.length} caracteres de título · {description.length} de descripción. Referencias orientativas: unos 60 y 155 caracteres. El buscador puede elegir otro texto.</p>
    <label>Indexación<select value={article.crawlPolicy||'index'} onChange={e=>onChange('crawlPolicy',e.target.value)}><option value="index">Permitir cuando el sitio esté habilitado</option><option value="noindex">No indexar</option></select></label>
    <label>Tarjeta social<select value={article.twitterCard||'summary_large_image'} onChange={e=>onChange('twitterCard',e.target.value)}><option value="summary_large_image">Imagen grande</option><option value="summary">Resumen</option></select></label>
    <label>Preferencia para rastreadores de IA<select value={article.aiCrawlPolicy||'allow'} onChange={e=>onChange('aiCrawlPolicy',e.target.value)}><option value="allow">Permitir</option><option value="disallow">Solicitar exclusión</option></select></label><p>Es una preferencia editorial. No impide el acceso público ni garantiza exclusión por todos los rastreadores.</p>
    <div className="article-seo-panel__preview" aria-label="Vista orientativa de buscador"><span>nicolaszamara.com/blog/{article.slug || 'url-del-articulo'}</span><h3>{title}</h3><p>{description}</p></div>
    <div className="article-seo-panel__preview" aria-label="Vista orientativa al compartir"><strong>{article.ogTitle||title}</strong><p>{article.ogDescription||description}</p></div>
  </details>
}
