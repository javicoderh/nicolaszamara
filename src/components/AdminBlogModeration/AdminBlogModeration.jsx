import { useCallback,useEffect,useState } from 'react'
import { useAdminQuery } from '../../hooks/useAdminQuery/useAdminQuery.js'
import { useDelayedOperation } from '../../hooks/useDelayedOperation/useDelayedOperation.js'
import { adminRequest,adminErrorMessage } from '../../services/adminService.js'
import AdminBlogModerationSkeleton from './AdminBlogModerationSkeleton.jsx'
import './AdminBlogModeration.css'
export default function AdminBlogModeration({onExpired}){
 const [state,setState]=useState('pending'),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const load=useCallback(signal=>adminRequest({operation:'blog',action:'comments',values:{state}},signal),[state]),query=useAdminQuery(load),remote=useDelayedOperation(15000)
 useEffect(()=>{if(query.error?.status==='unauthorized')onExpired?.()},[query.error,onExpired])
 function run(action,values){setError('');setNotice('');remote.run(signal=>adminRequest({operation:'blog',action,values},signal),({error:failure})=>{if(failure?.status==='unauthorized'){onExpired?.();return}if(failure)setError(adminErrorMessage(failure));else{setNotice('Moderación guardada.');query.reload()}})}
 return <section className="admin-blog-moderation"><h2>Comentarios del blog</h2><p>Los nuevos comentarios esperan tu revisión antes de mostrarse públicamente.</p><label>Estado del comentario<select value={state} onChange={event=>setState(event.target.value)}><option value="pending">Pendientes</option><option value="approved">Publicados</option><option value="rejected">Ocultos</option></select></label><button onClick={query.reload}>Actualizar comentarios</button>
  {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}{query.pending||remote.pending?<AdminBlogModerationSkeleton/>:query.error?<div role="alert"><p>No pudimos consultar los comentarios.</p><button onClick={query.reload}>Reintentar moderación</button></div>:!query.data?.items?.length?<p>No hay comentarios en este estado.</p>:<ul>{query.data.items.map(comment=><li key={comment.id}><div><strong>{comment.article_title}</strong><p>{comment.display_name} · {new Date(comment.created_at).toLocaleString('es-CL')}</p><p className="admin-blog-moderation__body">{comment.body}</p></div><div>{comment.state!=='approved'&&<button onClick={()=>run('comment_moderate',{id:comment.id,state:'approved'})}>Aprobar comentario</button>}{comment.state!=='rejected'&&<button onClick={()=>run('comment_moderate',{id:comment.id,state:'rejected'})}>Ocultar comentario</button>}<button onClick={()=>{if(window.confirm('¿Eliminar definitivamente este comentario?'))run('comment_delete',{id:comment.id})}}>Eliminar comentario</button></div></li>)}</ul>}
 </section>
}
