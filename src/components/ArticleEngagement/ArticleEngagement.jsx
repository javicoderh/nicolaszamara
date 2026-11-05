import { useCallback,useEffect,useRef,useState } from 'react'
import { useAdminQuery } from '../../hooks/useAdminQuery/useAdminQuery.js'
import { useDelayedOperation } from '../../hooks/useDelayedOperation/useDelayedOperation.js'
import { readArticleSocial,writeArticleSocial,socialError } from '../../services/blogSocialService.js'
import ArticleSaveButton from '../ArticleSaveButton/ArticleSaveButton.jsx'
import ArticleEngagementSkeleton from './ArticleEngagementSkeleton.jsx'
import './ArticleEngagement.css'
export default function ArticleEngagement({article}){
 const [page,setPage]=useState(1),[name,setName]=useState(''),[body,setBody]=useState(''),[website,setWebsite]=useState(''),[notice,setNotice]=useState(''),[error,setError]=useState(''),[reactions,setReactions]=useState(null)
 const load=useCallback(signal=>readArticleSocial(article.id,page,signal),[article.id,page]),query=useAdminQuery(load),remote=useDelayedOperation(20000),commentId=useRef(crypto.randomUUID())
 useEffect(()=>{if(query.data)setReactions({likes:query.data.likes,liked:query.data.liked})},[query.data])
 function run(action,values,done){setError('');setNotice('');remote.run(signal=>writeArticleSocial(article.id,action,values,signal),({value,error:failure})=>{if(failure)setError(socialError(failure));else done(value)})}
 function update(setter,value){setter(value);commentId.current=crypto.randomUUID()}
 const current=reactions||query.data||{likes:0,liked:false}
 return <section className="article-engagement" aria-label="Conversación y guardados"><h2>Continuemos la conversación</h2>
  <div className="article-engagement__actions"><button type="button" className="article-engagement__like" aria-pressed={Boolean(current.liked)} disabled={query.pending||remote.pending||Boolean(query.error)} onClick={()=>run('like',{liked:!current.liked},value=>setReactions({likes:value.likes,liked:value.liked}))}><span aria-hidden="true">{current.liked?'♥':'♡'}</span> Me gusta{query.data||reactions?` · ${current.likes}`:''}</button><ArticleSaveButton article={article}/></div>
  {notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}{remote.pending&&<ArticleEngagementSkeleton label="Guardando tu participación"/>}
  {query.pending?<ArticleEngagementSkeleton/>:query.error?<div role="status"><p>No pudimos cargar la conversación.</p><button onClick={query.reload}>Reintentar conversación</button></div>:<>
   <h3>Comentarios ({query.data?.total||0})</h3>
   {!query.data?.comments?.length&&<p>Aún no hay comentarios publicados. Puedes abrir la conversación.</p>}
   <ol className="article-engagement__comments">{query.data?.comments?.map(comment=><li key={comment.id}><header><strong>{comment.name}</strong><time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString('es-CL')}</time></header><p>{comment.body}</p>{comment.mine&&<button disabled={remote.pending} onClick={()=>run('comment_delete',{id:comment.id},()=>{setNotice('Comentario eliminado.');query.reload()})}>Eliminar mi comentario</button>}</li>)}</ol>
   {(page>1||query.data?.hasMore)&&<nav aria-label="Páginas de comentarios"><button disabled={page===1||remote.pending} onClick={()=>setPage(value=>value-1)}>Anteriores</button><span>Página {page}</span><button disabled={!query.data?.hasMore||remote.pending} onClick={()=>setPage(value=>value+1)}>Más comentarios</button></nav>}
   {query.data?.myPending?.length>0&&<aside className="article-engagement__pending"><h3>Tus comentarios pendientes</h3><p>Solo tú puedes verlos hasta que se aprueben.</p>{query.data.myPending.map(comment=><div key={comment.id}><p>{comment.body}</p><button disabled={remote.pending} onClick={()=>run('comment_delete',{id:comment.id},query.reload)}>Retirar comentario pendiente</button></div>)}</aside>}
  </>}
  <form onSubmit={event=>{event.preventDefault();run('comment',{id:commentId.current,name,body,website},value=>{setBody('');commentId.current=crypto.randomUUID();setNotice(value.state==='approved'?'Tu comentario ya está publicado.':'Gracias. Tu comentario quedó pendiente de revisión.');query.reload()})}}><fieldset disabled={remote.pending||query.pending||Boolean(query.error)}><legend>Comparte tu mirada</legend><p>Tu nombre y comentario podrán verse en el blog cuando se aprueben. No necesitas una cuenta.</p><label>Nombre público<input autoComplete="nickname" required maxLength={60} value={name} onChange={event=>update(setName,event.target.value)}/></label><label>Tu comentario<textarea required rows={5} maxLength={2000} value={body} onChange={event=>update(setBody,event.target.value)}/></label><p className="article-engagement__counter">{body.length}/2000 caracteres</p><div hidden aria-hidden="true"><label>Dejar vacío<input tabIndex={-1} autoComplete="off" value={website} onChange={event=>setWebsite(event.target.value)}/></label></div><button type="submit" disabled={!name.trim()||!body.trim()}>Enviar comentario</button></fieldset></form>
 </section>
}
