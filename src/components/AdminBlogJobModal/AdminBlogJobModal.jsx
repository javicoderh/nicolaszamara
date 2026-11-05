import { useEffect, useState } from 'react'
import AdminModal from '../AdminModal/AdminModal.jsx'
import AdminBlogJobModalSkeleton from './AdminBlogJobModalSkeleton.jsx'
import { useAdminQuery } from '../../hooks/useAdminQuery/useAdminQuery.js'
import { adminRequest, adminErrorMessage } from '../../services/adminService.js'
import './AdminBlogJobModal.css'
import AdminIcon from '../AdminIcon/AdminIcon.jsx'

const load = (signal, id) => adminRequest({ operation: 'blog', action: 'job_detail', values: { id } }, signal)
const states = { pending: 'En espera', processing: 'En curso', failed: 'Requiere atención', needs_input: 'Necesita aclaración', completed: 'Borrador entregado', cancelled: 'Detenido' }
const stages = { brief: 'Investigación y brief', draft: 'Redacción', critique: 'Revisión editorial', final: 'Versión final y SEO', done: 'Completado' }
function cost(job) {
  const records = Object.entries(job.artifacts || {}).filter(([key]) => key.endsWith('_record')).map(([, value]) => value.usage)
  if (job.engine === 'codex_session') return 'API de inferencia del proyecto: US$0 (sesión Codex)'
  if (!records.length || records.some(usage => usage?.costMicroUsd == null)) return 'Costo real: pendiente o desconocido'
  return `Consumo conocido: US$${(records.reduce((sum, usage) => sum + usage.costMicroUsd, 0) / 1e6).toFixed(4)}`
}
export default function AdminBlogJobModal({ id, onClose, run, busy, onArticle, onExpired, error, notice, draftAnswer, onDraftAnswerChange }) {
  const query = useAdminQuery(load, id)
  const [localAnswer, setLocalAnswer] = useState('')
  const answer = draftAnswer ?? localAnswer
  const setAnswer = onDraftAnswerChange || setLocalAnswer
  const selected = query.data?.job
  useEffect(() => { if (query.error?.status === 'unauthorized') onExpired?.() }, [query.error, onExpired])
  function action(operation) { run(operation, { id }, () => query.reload()) }
  function exportJob() {
    const blob = new Blob([JSON.stringify({ idea: selected.idea, brief: selected.brief, artifacts: selected.artifacts }, null, 2)], { type: 'application/json' })
    const href = URL.createObjectURL(blob), link = document.createElement('a')
    link.href = href; link.download = `encargo-${id}.json`; link.click()
    setTimeout(() => URL.revokeObjectURL(href), 0)
  }
  return <AdminModal icon="queue" title="Encargo editorial" onClose={onClose} closeLabel="Cerrar encargo" contentClassName="admin-blog admin-blog-job-modal">
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {query.pending || busy ? <AdminBlogJobModalSkeleton /> : query.error ? <div role="alert"><p>{adminErrorMessage(query.error)}</p><button onClick={query.reload}>Reintentar detalle del encargo</button></div> : selected && <>
      <h3>Encargo original</h3><p className="admin-blog-job-modal__idea">{selected.idea}</p>
      <dl><div><dt>Estado</dt><dd>{states[selected.state] || selected.state}</dd></div><div><dt>Etapa</dt><dd>{stages[selected.stage] || selected.stage}</dd></div><div><dt>Intento</dt><dd>{selected.attempts || 1}</dd></div><div><dt>Origen</dt><dd>{selected.engine === 'codex_session' ? 'Codex' : 'Interfaz y API'}</dd></div></dl>
      <p className="admin-blog-job-modal__identifier">Identificador: {id}</p>
      {selected.error_code && <p role="status">Motivo: {selected.error_code}</p>}
      <p>{cost(selected)}</p><p>Reserva acumulada: US${((selected.reserved_micro_usd || 0) / 1e6).toFixed(2)}. Es un techo preventivo, no la factura.</p>
      <div className="admin-blog-job-modal__actions"><button onClick={query.reload}><AdminIcon name="refresh"/> Actualizar encargo</button>
        {selected.saved_idea && <button onClick={() => action('idea_start')}>Generar esta idea</button>}
        {selected.state === 'failed' && <button disabled={selected.attempts >= 3} onClick={() => action('job_retry')}>Reintentar generación</button>}
        {selected.state === 'failed' && selected.engine === 'api' && selected.provider_response_id && <button disabled={selected.artifacts?.responseRevalidations>=3} onClick={() => action('job_revalidate')}>Revisar respuesta guardada</button>}
        {['pending','processing','needs_input'].includes(selected.state) && <button onClick={() => action('job_cancel')}>Detener encargo</button>}
        {selected.result_id && <button onClick={() => run('detail', { id: selected.result_id }, value => { onClose(); onArticle(value) })}>Abrir borrador del encargo</button>}
        <button onClick={exportJob}><AdminIcon name="download"/> Exportar encargo</button></div>
      <p>Detener evita nuevas etapas; una llamada ya iniciada puede consumir tokens.</p>
      {selected.state === 'failed' && selected.provider_response_id && <p>Revisar la respuesta guardada reutiliza esta etapa sin volver a generarla. Si supera la validación, las etapas restantes continúan con su consumo de API y sus límites de presupuesto habituales.</p>}
      {selected.brief?.editorialWarnings?.length > 0 && <aside role="status"><strong>Enlaces opcionales pendientes de revisión</strong><ul>{selected.brief.editorialWarnings.map((warning,index)=><li key={index}>{warning}</li>)}</ul><p>Puedes añadir el reel correcto al editar el artículo.</p></aside>}
      {selected.state === 'needs_input' && <form onSubmit={event => { event.preventDefault(); run('job_reply', { id, answer }, () => { setAnswer(''); query.reload() }) }}><label>{selected.artifacts?.question || '¿Qué detalle te gustaría precisar?'}<textarea required maxLength={2000} value={answer} onChange={event => setAnswer(event.target.value)} /></label><button>Continuar generación</button></form>}
      {selected.brief && <details open><summary>Brief investigado</summary><pre>{JSON.stringify(selected.brief, null, 2)}</pre></details>}
      {Object.entries(selected.artifacts || {}).filter(([key]) => ['draft','critique','final','brief_record','draft_record','critique_record','final_record'].includes(key)).map(([key, value]) => <details key={key}><summary>{({ draft: 'Borrador inicial', critique: 'Revisión editorial', final: 'Versión final' })[key] || `Registro de ${key.replace('_record', '')}`}</summary><pre>{JSON.stringify(value, null, 2)}</pre></details>)}
    </>}
  </AdminModal>
}
