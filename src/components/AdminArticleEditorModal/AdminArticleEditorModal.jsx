import AdminIcon from '../AdminIcon/AdminIcon.jsx'
import AdminModal from '../AdminModal/AdminModal.jsx'
import AdminArticleEditorModalSkeleton from './AdminArticleEditorModalSkeleton.jsx'
import ArticleContent from '../ArticleContent/ArticleContent.jsx'
import ArticleImageEditor from '../ArticleImageEditor/ArticleImageEditor.jsx'
import ArticleSeoPanel from '../ArticleSeoPanel/ArticleSeoPanel.jsx'
import ArticleBlockEditor from '../ArticleBlockEditor/ArticleBlockEditor.jsx'
import { publicationIssues, titleSlug } from '../../services/blogPublication.js'
import protocol from '../../../config/blog/protocol.json'
import './AdminArticleEditorModal.css'

export default function AdminArticleEditorModal({ open, record, draft, dirty, busy, categories, revisions, revisionPreview, preview, error, notice, onClose, save, update, updateImage, reference, setPreview, run, select, setRecord, setNotice, setRecordClosed, setRevisions, setRevisionPreview, onExpired }) {
  const remote = { pending: busy }
  const issues = publicationIssues(draft)
  const imagesReady = issues.length === 0
  const content = () => draft
  return <AdminModal open={open} title={record.id ? 'Editar artículo' : 'Nuevo artículo'} onClose={onClose} closeLabel="Cerrar artículo" contentClassName="admin-blog admin-article-editor-modal">
    {busy && <AdminArticleEditorModalSkeleton />}{error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
<section className="admin-blog__editor"><h2>{record.id ? 'Editar artículo' : 'Nuevo artículo'}</h2><p role="status">{dirty ? 'Hay cambios pendientes de guardar.' : 'Borrador al día.'}</p><form onSubmit={save}><fieldset disabled={remote.pending}>
      <details open><summary>Datos de lectura</summary>{Object.entries({ title: 'Título', slug: 'URL del artículo', summary: 'Introducción', author: 'Autor', authorBio: 'Presentación del autor (opcional)', reviewer: 'Revisor editorial (opcional)' }).map(([name, label]) => {const missing=Boolean(record.id&&['title','slug','summary','author'].includes(name)&&!draft[name]?.trim());return <label key={name}>{label}<input name={name} list={name==='author'?'blog-authors':undefined} maxLength={({title:160,slug:100,summary:400,author:120,authorBio:1000,reviewer:120})[name]} value={draft[name] || ''} aria-invalid={missing||undefined} aria-describedby={missing?`blog-error-${name}`:undefined} onChange={(event) => update(name, event.target.value)} />{missing&&<span id={`blog-error-${name}`}>Completa este dato antes de publicar.</span>}</label>})}<datalist id="blog-authors"><option value="Nicolás Zamara"/><option value="Equipo editorial de Nicolás Zamara"/></datalist>
      <button type="button" onClick={()=>update('slug',titleSlug(draft.title))}>Proponer URL desde el título</button>
      <label>Fecha de revisión editorial<input type="date" value={draft.reviewedAt||''} onChange={e=>update('reviewedAt',e.target.value)}/></label>
      </details><details><summary>Clasificación y vínculos</summary>
      <label>Categoría<select value={draft.category} onChange={(event) => update('category', event.target.value)}>{Object.entries(categories).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label>Etiquetas internas (una por línea)<textarea value={(draft.internalTags||[]).join('\n')} onChange={e=>update('internalTags',e.target.value.split('\n').filter(Boolean))}/></label>
      <label>Artículos relacionados (hasta tres slugs, uno por línea)<textarea value={(draft.relatedSlugs||[]).join('\n')} onChange={e=>update('relatedSlugs',e.target.value.split('\n').filter(Boolean))}/></label>
      <label>Invitación final<select value={draft.relatedServiceId||''} onChange={e=>update('relatedServiceId',e.target.value||null)}><option value="">Sin invitación comercial</option>{Object.entries(protocol.services).map(([id,path])=><option key={id} value={id}>{path}</option>)}</select></label>
      </details><details><summary>Instagram y referencias</summary>
      <label>Fuentes (una URL por línea)<textarea rows={3} value={(draft.sources || []).join('\n')} onChange={(event) => update('sources', event.target.value.split('\n').filter(Boolean))} /></label>
      {(draft.sources||[]).map((url,index)=><label key={url}>Título de la fuente {index+1}<input value={draft.sourceDetails?.find(item=>item.url===url)?.title||''} onChange={event=>reference('sourceDetails',url,{title:event.target.value})}/></label>)}
      <label>Reels (una URL por línea)<textarea rows={3} value={(draft.reels || []).join('\n')} onChange={(event) => update('reels', event.target.value.split('\n').filter(Boolean))} /></label>
      <p>El primer reel es el principal. Cambia el orden de las líneas para modificar la prioridad.</p>{(draft.reels||[]).map((url,index)=><label key={url}>Etiqueta del reel {index+1}<input value={draft.reelDetails?.find(item=>item.url===url)?.label||''} onChange={event=>reference('reelDetails',url,{label:event.target.value})}/></label>)}
      </details>
      <ArticleSeoPanel article={draft} onChange={update}/>
      <details open><summary>Fotografías del artículo</summary><div className="admin-blog__images">
        <ArticleImageEditor key={`${record.id || 'new'}-cover`} label="Imagen de apertura" aspect={1.5} value={{ src: draft.cover, alt: draft.coverAlt, caption: draft.coverCaption,position:draft.coverPosition }} onChange={(patch) => updateImage('cover', patch)} onExpired={onExpired} />
        <div><ArticleImageEditor key={`${record.id || 'new'}-body`} label="Imagen interior" aspect={.8} value={draft.bodyImage || {}} onChange={(patch) => updateImage('body', patch)} onExpired={onExpired} />
          <label>Ubicación de la imagen interior<select value={draft.bodyImage?.afterBlock ?? 'auto'} onChange={(event) => updateImage('body', { afterBlock: event.target.value === 'auto' ? null : Number(event.target.value) })}><option value="auto">Automática, hacia la mitad del artículo</option>{draft.document.blocks.slice(0, -1).map((block, index) => <option key={index} value={index}>Después del bloque {index + 1}: {(block.text || block.items?.[0] || 'Separador').slice(0, 45)}</option>)}</select></label>
          <label>Alineación con el texto<select value={draft.bodyImage?.alignment || 'right'} onChange={(event) => updateImage('body', { alignment: event.target.value })}><option value="right">Imagen a la derecha</option><option value="left">Imagen a la izquierda</option></select></label>
        </div>
      </div></details>
      <ArticleBlockEditor document={draft.document} onChange={value=>update('document',value)}/>
      <button type="submit"><AdminIcon name="save"/> Guardar borrador</button><button type="button" onClick={() => setPreview((value) => !value)}><AdminIcon name="eye"/> Vista previa</button>
    </fieldset></form>
    {record.id && <div className="admin-blog__actions">{issues.length>0&&<div role="status"><p>Requisitos pendientes:</p><ul>{issues.map(issue=><li key={issue}>{issue}</li>)}</ul></div>}<p>{!imagesReady ? 'Antes de publicar, añade las dos imágenes y sus descripciones accesibles.' : dirty ? 'Guarda los cambios antes de publicar esta versión.' : 'Las dos imágenes están preparadas para revisar.'}</p><button disabled={remote.pending || dirty || !imagesReady} onClick={() => run('publish', { id: record.id, version: record.version }, (value) => { setRecord(value.article); setNotice('Artículo publicado.') })}><AdminIcon name="check"/> Publicar versión guardada</button><button disabled={remote.pending} onClick={() => run('archive', { id: record.id, version: record.version }, (value) => setRecord(value.article))}><AdminIcon name="archive"/> Archivar</button><button disabled={remote.pending || record.state !== 'published'} onClick={() => run('feature', { id: record.id, version: record.version })}>Destacar</button>{record.state === 'archived' && <button onClick={() => { if (window.confirm(`¿Eliminar definitivamente «${draft.title}» y sus versiones?`)) run('delete', { id: record.id, version: record.version }, () => setRecordClosed()) }}>Eliminar definitivamente</button>}</div>}
    {preview && <ArticleContent article={content()} privateMedia />}
    {record.id && <details><summary>Historial de versiones</summary><button disabled={remote.pending} onClick={()=>run('detail',{id:record.id},value=>setRevisions(value.revisions||[]))}>Actualizar historial</button>{revisions.map((item) => <p key={item.version}>Versión {item.version} · {item.actor} · {new Date(item.created_at).toLocaleString('es-CL')} <button onClick={()=>run('revision',{id:record.id,revision:item.version},value=>setRevisionPreview(value.document))}>Ver versión</button><button onClick={() => run('restore', { id: record.id, version: record.version, restore_version: item.version }, select)}>Restaurar como borrador</button></p>)}{revisionPreview&&<ArticleContent article={revisionPreview} privateMedia/>}</details>}
    </section>
  </AdminModal>
}
