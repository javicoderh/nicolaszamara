import AdminIcon from '../AdminIcon/AdminIcon.jsx'
import AdminArticleEditorModal from '../AdminArticleEditorModal/AdminArticleEditorModal.jsx'
import AdminModule, { openAdminModule } from '../AdminModule/AdminModule.jsx'
import { useEffect, useRef, useState } from 'react'
import { useAdminQuery } from '../../hooks/useAdminQuery/useAdminQuery.js'
import { useDelayedOperation } from '../../hooks/useDelayedOperation/useDelayedOperation.js'
import { adminRequest, adminErrorMessage } from '../../services/adminService.js'
import AdminBlogSkeleton from './AdminBlogSkeleton.jsx'
import protocol from '../../../config/blog/protocol.json'
import './AdminBlog.css'
import AdminArticleList from '../AdminArticleList/AdminArticleList.jsx'
import AdminBlogCatalog from '../AdminBlogCatalog/AdminBlogCatalog.jsx'
import AdminBlogQueue from '../AdminBlogQueue/AdminBlogQueue.jsx'
import AdminBlogModeration from '../AdminBlogModeration/AdminBlogModeration.jsx'

const request = (action, values = {}, signal) => adminRequest({ operation: 'blog', action, values }, signal)
const list = (signal) => request('list', {}, signal)
const jobs = (signal) => request('jobs', {}, signal)
const catalog = (signal) => request('catalog', {}, signal)
const generation = (signal) => request('generation_info', {}, signal)
const empty = () => ({ slug: '', title: '', summary: '', author: 'Nicolás Zamara', category: 'naturaleza', cover: '', coverAlt: '', coverCaption: '', bodyImage: { src: '', alt: '', caption: '', alignment: 'right', afterBlock: null }, seoTitle: '', metaDescription: '', document: { version: 1, blocks: [] } })

export default function AdminBlog({ onExpired }) {
  const query = useAdminQuery(list)
  const queue = useAdminQuery(jobs)
  const taxonomy = useAdminQuery(catalog)
  const generationSettings = useAdminQuery(generation)
  const categories = taxonomy.data?.items?.length ? Object.fromEntries(taxonomy.data.items.map(item => [item.id, item.name])) : protocol.categories
  const remote = useDelayedOperation(15000)
  const [record, setRecord] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [activeModule, setActiveModule] = useState(null)
  const [draft, setDraft] = useState(empty)
  const [idea, setIdea] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [preview, setPreview] = useState(false)
  const [revisions, setRevisions] = useState([])
  const [dirty, setDirty] = useState(false)
  const [autoPaused, setAutoPaused] = useState(false)
  const ideaId = useRef(crypto.randomUUID())
  const draftId = useRef(crypto.randomUUID())
  const [revisionPreview, setRevisionPreview] = useState(null)
  useEffect(() => { const saved = sessionStorage.getItem('nz-blog-idea'); if (saved) setIdea(saved) }, [])
  useEffect(() => { sessionStorage.setItem('nz-blog-idea', idea) }, [idea])
  const activeJobs = Boolean(queue.data?.items.some((job) => ['pending', 'processing'].includes(job.state)))
  useEffect(() => {
    if (!activeJobs || queue.pending) return
    const timer = setTimeout(queue.reload, 10000)
    return () => clearTimeout(timer)
  }, [activeJobs, queue.pending, queue.reload])
  const latest = useRef(draft); latest.current = draft
  useEffect(() => {
    if (!dirty) return
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  useEffect(() => {
    if (!dirty || !record?.id || remote.pending || autoPaused) return
    const candidate = draft
    const timer = setTimeout(() => run('save', { id: record.id, version: record.version, document: candidate }, (value) => {
      setRecord(value.article)
      if (latest.current === candidate) { setDraft(value.article.document); setDirty(false) }
      setNotice('Borrador guardado automáticamente.')
    }), 1500)
    return () => clearTimeout(timer)
  }, [draft, dirty, record?.id, record?.version, remote.pending, autoPaused])
  function run(action, values, done) {
    setError(''); setNotice('')
    remote.run((signal) => request(action, values, signal), ({ value, error: failure }) => {
      if (failure?.status === 'unauthorized') { onExpired(); return }
      if (failure) { setError(adminErrorMessage(failure)); setAutoPaused(true) }
      else { done?.(value); query.reload(); queue.reload(); if (action.startsWith('category_')) taxonomy.reload(); if (['publish','archive','move','reorder','feature'].includes(action)) window.dispatchEvent(new Event('nz-blog-updated')) }
    })
  }
  function createManual() { if (dirty && !window.confirm('¿Salir del borrador con cambios pendientes?')) return; draftId.current = crypto.randomUUID(); setRecord({}); setDraft(empty()); setDirty(false); setAutoPaused(false); setRevisions([]); setEditorOpen(true) }
  function select(value) {
    setEditorOpen(true)
    setDirty(false); setAutoPaused(false)
    setRecord(value.article); setDraft(value.article.document)
    if(value.revisions)setRevisions(value.revisions); setPreview(false); setRevisionPreview(null)
  }
  function update(name, value) { setDirty(true); setDraft((previous) => ({ ...previous, [name]: value, ...(name==='sources'?{sourceDetails:(previous.sourceDetails||[]).filter(item=>value.includes(item.url))}:name==='reels'?{reelDetails:(previous.reelDetails||[]).filter(item=>value.includes(item.url))}:{}) })) }
  function updateImage(slot, patch) {
    setDirty(true)
    setDraft((previous) => slot === 'cover'
      ? { ...previous, ...Object.fromEntries(Object.entries(patch).map(([key, value]) => [({ src: 'cover', alt: 'coverAlt', caption: 'coverCaption',position:'coverPosition' })[key], value])) }
      : { ...previous, bodyImage: { ...previous.bodyImage, ...patch } })
  }
  function reference(field,url,patch){update(field,[...(draft[field]||[]).filter(item=>item.url!==url),{...(draft[field]||[]).find(item=>item.url===url),url,...patch}])}
  function content() { return draft }
  function save(event) {
    event.preventDefault()
    const candidate = draft
    run(record?.id ? 'save' : 'create', { id: record?.id || draftId.current, ...(record?.id ? { version: record.version } : {}), document: content() }, (value) => { setRecord(value.article); if (latest.current === candidate) { setDraft(value.article.document); setDirty(false) }; setAutoPaused(false); setNotice('Borrador guardado. La versión pública solo cambia al publicar.') })
  }
  const feedback = <>{remote.pending && <AdminBlogSkeleton />}{error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}</>
  const moduleProps = id => ({ onActiveChange: open => setActiveModule(open ? id : null), feedback: !editorOpen && activeModule === id ? feedback : null })
  return <section className="admin-blog admin-blog--workspace"><header><p className="admin-blog__eyebrow">Espacio editorial</p><h1>Ideas que merecen tiempo.</h1><p>Prepara lecturas para continuar la conversación con tu audiencia.</p></header>
    <nav className="admin-blog__shortcuts" aria-label="Accesos del blog">
      <button type="button" onClick={() => openAdminModule('blog-create')}><AdminIcon name="sparkles"/> Crear con IA</button>
      <button type="button" disabled={remote.pending} onClick={createManual}><AdminIcon name="create"/> Nuevo artículo manual</button>
      {[['blog-articles','Artículos'],['blog-queue','Cola editorial'],['blog-categories','Categorías'],['blog-comments','Comentarios']].map(([id,label]) => <button type="button" key={id} onClick={() => openAdminModule(id)}><AdminIcon name={id}/> {label}</button>)}
      {record && <button type="button" onClick={() => setEditorOpen(true)}><AdminIcon name="edit"/> Continuar edición</button>}
    </nav>
    <AdminModule {...moduleProps('blog-create')} id="blog-create" title="Crear con IA" description="Describe una idea o guarda un encargo para generar contenido."><section className="admin-blog__idea"><h2>¿Qué artículo te gustaría crear?</h2><p id="blog-idea-help">Cuéntanos el tema y todos los detalles que quieras: público, tono, historia, objetivo, ideas clave, fuentes o enlaces a reels.</p><form onSubmit={(event) => { event.preventDefault(); run('job_create', { id: ideaId.current, idea }, () => { setIdea(''); ideaId.current = crypto.randomUUID(); setNotice('Idea recibida. Puedes revisar el avance en la cola.') }) }}><label className="admin-blog__label" htmlFor="blog-idea">Tu idea</label><textarea id="blog-idea" rows={8} maxLength={12000} required value={idea} aria-describedby="blog-idea-help" onChange={(event) => { setIdea(event.target.value); ideaId.current = crypto.randomUUID() }} placeholder="Quiero un artículo sobre los baños de bosque, con tono poético y storytelling, para conectar con adultos de 40 a 60 años…" /><p>{idea.trim().split(/\s+/).filter(Boolean).length}/1500 palabras · {idea.length}/12000 caracteres</p><p>Referencia con Sol: aproximadamente US$0.31. El resultado quedará como borrador para revisar y publicar. Las imágenes se añaden después.</p>{generationSettings.data && <p>Modelo: {generationSettings.data.model}. Límite por trabajo: US${generationSettings.data.jobLimitUsd}; diario: US${generationSettings.data.dailyLimitUsd}.{!generationSettings.data.enabled && ' La generación aún no está activada en este entorno.'}</p>}<button disabled={remote.pending || idea.trim().split(/\s+/).length > 1500}>Generar artículo</button><button type="button" disabled={remote.pending || !idea.trim() || idea.trim().split(/\s+/).length > 1500} onClick={() => run('idea_save', { id: ideaId.current, idea }, () => { setIdea(''); ideaId.current = crypto.randomUUID(); setNotice('Idea guardada sin iniciar la generación.') })}>Guardar idea</button></form></section>
    </AdminModule>
    {!editorOpen && !activeModule && feedback}
    <AdminModule {...moduleProps('blog-articles')} id="blog-articles" title="Artículos" description="Busca, ordena y abre tus borradores y publicaciones."><section className="admin-blog__list"><h2>Artículos</h2><button type="button" onClick={createManual}>Crear manualmente</button><button type="button" onClick={query.reload}>Actualizar</button>
      <AdminArticleList items={query.data?.items} pending={query.pending} error={query.error} busy={remote.pending} categories={categories} onRetry={query.reload} onEdit={item=>{ if (dirty && !window.confirm('¿Salir del borrador con cambios pendientes?')) return; run('detail',{id:item.id},select) }} onMove={(item,position)=>run('move',{id:item.id,version:item.version,position})}/>
    </section>
    </AdminModule>
    <AdminBlogCatalog moduleProps={moduleProps('blog-categories')} items={taxonomy.data?.items} pending={taxonomy.pending} error={taxonomy.error} busy={remote.pending} onRetry={taxonomy.reload} onSave={values=>run('category_save',values)} onDelete={id=>run('category_delete',{id})}/>
    {record && <AdminArticleEditorModal open={editorOpen} record={record} draft={draft} dirty={dirty} busy={remote.pending} categories={categories} revisions={revisions} revisionPreview={revisionPreview} preview={preview} error={error} notice={notice}
      onClose={() => setEditorOpen(false)} save={save} update={update} updateImage={updateImage} reference={reference} setPreview={setPreview} run={run} select={select} setRecord={setRecord} setNotice={setNotice} setRecordClosed={() => { setRecord(null); setEditorOpen(false) }} setRevisions={setRevisions} setRevisionPreview={setRevisionPreview} onExpired={onExpired} />}

    <AdminModule {...moduleProps('blog-queue')} id="blog-queue" title="Cola editorial" description="Sigue los encargos, revisa fichas y abre los resultados."><AdminBlogQueue query={queue} run={run} busy={remote.pending} onArticle={select} onExpired={onExpired} error={error} notice={notice}/>
    </AdminModule>
    <AdminModule {...moduleProps('blog-comments')} id="blog-comments" title="Comentarios" description="Revisa y modera las conversaciones del blog."><AdminBlogModeration onExpired={onExpired}/></AdminModule>
  </section>
}
