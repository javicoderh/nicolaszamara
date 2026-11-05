import { useState,useSyncExternalStore } from 'react'
import { savedArticlesStore } from '../../services/savedArticlesStore.js'
import './ArticleSaveButton.css'
export default function ArticleSaveButton({article,store=savedArticlesStore}){
 const items=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getServerSnapshot),[error,setError]=useState(false)
 const saved=items.some(item=>item.id===article.id)
 return <div className="article-save-button"><button type="button" aria-pressed={saved} onClick={()=>setError(!store.toggle(article))}>{saved?'Guardado en este navegador':'Guardar artículo'} <svg aria-hidden="true" width="16" height="20" viewBox="0 0 16 20" fill={saved?'currentColor':'none'} stroke="currentColor"><path d="M2 1h12v17l-6-4-6 4z"/></svg></button>{error&&<p role="status">No pudimos guardar la lectura. Revisa el almacenamiento del navegador o el límite de 100 guardados.</p>}</div>
}
