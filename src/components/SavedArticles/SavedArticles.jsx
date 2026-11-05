import { useState,useSyncExternalStore } from 'react'
import { savedArticlesStore } from '../../services/savedArticlesStore.js'
import './SavedArticles.css'
export default function SavedArticles({onOpen,store=savedArticlesStore}){
 const items=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getServerSnapshot),[error,setError]=useState(false)
 if(!items.length)return null
 return <details className="saved-articles"><summary>Guardados ({items.length})</summary><p>Guardados en este navegador. Se necesita conexión para abrir la versión actual del artículo.</p><ul>{items.map(item=><li key={item.id}><a href={`/blog/${item.slug}`} onClick={event=>onOpen?.(event,item)}>{item.title}</a><button type="button" aria-label={`Quitar de guardados: ${item.title}`} onClick={()=>setError(!store.remove(item.id))}>Quitar</button></li>)}</ul>{error&&<p role="status">No pudimos actualizar tus guardados.</p>}</details>
}
