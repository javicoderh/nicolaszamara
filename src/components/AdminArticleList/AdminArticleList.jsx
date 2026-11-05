import AdminIcon from '../AdminIcon/AdminIcon.jsx'
import { useState } from 'react'
import AdminArticleListSkeleton from './AdminArticleListSkeleton.jsx'
import './AdminArticleList.css'
export default function AdminArticleList({ items = [], pending, error, busy, onRetry, onEdit, onMove, categories = {} }) {
  const [search, setSearch] = useState(''), [state, setState] = useState(''), [category, setCategory] = useState('')
  const publications = items.filter(item => item.state === 'published').sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
  const visible = items.filter(item => (!state || item.state === state) && (!category || item.category === category) && `${item.title} ${item.author}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')))
  return <div className="admin-article-list">
    <div className="admin-article-list__filters"><label>Buscar artículos<input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <label>Estado del artículo<select value={state} onChange={e => setState(e.target.value)}><option value="">Todos</option><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select></label>
      <label>Filtrar categoría<select value={category} onChange={e => setCategory(e.target.value)}><option value="">Todas</option>{Object.entries(categories).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label></div>
    {pending ? <AdminArticleListSkeleton /> : error ? <div role="alert"><p>No pudimos consultar los artículos.</p><button onClick={onRetry}>Reintentar listado</button></div> : !visible.length ? <p>No hay artículos para estos filtros.</p> : <ul>{visible.map(item => {
      const position = publications.findIndex(entry => entry.id === item.id)
      return <li key={item.id} onDragOver={event=>{if(position>=0)event.preventDefault()}} onDrop={event=>{event.preventDefault();const source=publications.find(entry=>entry.id===event.dataTransfer.getData('text/plain'));if(source&&source.id!==item.id&&!busy)onMove(source,position)}}><div>{position>=0&&<button type="button" draggable={!busy} aria-label={`Arrastrar para ordenar ${item.title}`} onDragStart={event=>{event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',item.id)}}>⠿</button>}<strong>{item.title || 'Sin título'}</strong><span>{({ draft: 'Borrador', published: 'Publicado', archived: 'Archivado' })[item.state]} · {item.author} · v{item.version}{item.featured ? ' · Destacado' : ''}{item.published_version && item.version !== item.published_version ? ' · Cambios sin publicar' : ''}</span><time>{item.updated_at && new Date(item.updated_at).toLocaleDateString('es-CL')}</time></div>
        <button disabled={busy} onClick={() => onEdit(item)}><AdminIcon name="edit"/> Editar {item.title || 'artículo'}</button>
        {position >= 0 && <div className="admin-article-list__order"><span>Posición global {position + 1}</span><button disabled={busy || position === 0} onClick={() => onMove(item, position - 1)}>Subir</button><button disabled={busy || position === publications.length - 1} onClick={() => onMove(item, position + 1)}>Bajar</button>
          <form onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); onMove(item, Number(data.get('position')) - 1) }}><label>Mover a posición<input name="position" type="number" min="1" max={publications.length} defaultValue={position + 1} required /></label><button disabled={busy}>Mover</button></form></div>}
      </li>
    })}</ul>}
  </div>
}
