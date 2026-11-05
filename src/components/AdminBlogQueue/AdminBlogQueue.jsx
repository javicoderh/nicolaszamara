import AdminBlogJobModal from '../AdminBlogJobModal/AdminBlogJobModal.jsx'
import { useState } from 'react'
import AdminBlogQueueSkeleton from './AdminBlogQueueSkeleton.jsx'
import './AdminBlogQueue.css'
export default function AdminBlogQueue({ query, run, busy, onArticle, onExpired, error, notice }){
 const [selected,setSelected]=useState(null)
 const [answers,setAnswers]=useState({})
 function detail(id){setSelected(id)}
 return <section className="admin-blog-queue"><h2>Cola editorial</h2><p>Los encargos se procesan por orden de llegada, uno por vez. Puedes cerrar el navegador; el avance queda guardado.</p><button onClick={query.reload}>Actualizar avance</button>
 {query.pending?<AdminBlogQueueSkeleton/>:query.error?<div role="alert"><p>No pudimos consultar la cola.</p><button onClick={query.reload}>Reintentar cola</button></div>:<ol>{query.data?.items.map(job=><li key={job.id}><div><strong>{job.idea.slice(0,100)}</strong><p>{job.engine==='codex_session'?'Desde Codex':'Generación asistida'} · {job.saved_idea?'Idea guardada':({pending:'En espera',processing:'En curso',completed:'Borrador listo para revisar',failed:'Requiere atención',needs_input:'Necesita una aclaración',cancelled:'Detenido'})[job.state]}</p>{!job.saved_idea&&<p>{({brief:'1. Investigación y brief',draft:'2. Redacción',critique:'3. Revisión editorial',final:'3. Versión final y SEO',done:'Entregado'})[job.stage]} · Intento {job.attempts||1}</p>}{job.error_code&&<p role="status">Motivo: {job.error_code}. Revisa el encargo antes de reintentar.</p>}</div>
 <button disabled={busy} onClick={()=>detail(job.id)}>Ver encargo y ficha</button>{job.saved_idea&&<button disabled={busy} onClick={()=>run('idea_start',{id:job.id})}>Generar esta idea</button>}
 {job.state==='failed'&&<button disabled={busy||job.attempts>=3} onClick={()=>run('job_retry',{id:job.id})}>Reintentar generación</button>}{['pending','processing','needs_input'].includes(job.state)&&<button disabled={busy} onClick={()=>run('job_cancel',{id:job.id})}>Detener</button>}{job.result_id&&<button disabled={busy} onClick={()=>run('detail',{id:job.result_id},onArticle)}>Abrir borrador</button>}
 </li>)}</ol>}
 {selected && <AdminBlogJobModal key={selected} id={selected} draftAnswer={answers[selected]||''} onDraftAnswerChange={value=>setAnswers(previous=>({...previous,[selected]:value}))} onClose={()=>setSelected(null)} run={run} busy={busy} onArticle={onArticle} onExpired={onExpired} error={error} notice={notice} />}
 </section>
}
