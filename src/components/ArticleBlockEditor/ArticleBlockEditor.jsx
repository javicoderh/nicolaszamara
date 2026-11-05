import './ArticleBlockEditor.css'
import { useState } from 'react'
import { importArticleText } from '../../services/articleTextImport.js'
import { useDelayedOperation } from '../../hooks/useDelayedOperation/useDelayedOperation.js'
import ArticleBlockEditorSkeleton from './ArticleBlockEditorSkeleton.jsx'
const labels={paragraph:'Párrafo',heading:'Subtítulo',quote:'Cita',list:'Lista',link:'Enlace',separator:'Separador'}
export default function ArticleBlockEditor({ document, onChange }) {
  const [source, setSource] = useState('')
  const [importError, setImportError] = useState('')
  const importing = useDelayedOperation()
  function incorporate(replace) {
    setImportError('')
    importing.run(() => {
      const imported = importArticleText(source)
      const next = replace ? imported : { version: 1, blocks: [...document.blocks, ...imported.blocks] }
      if (next.blocks.length > 200) throw new Error('El artículo admite hasta 200 bloques.')
      if (new TextEncoder().encode(JSON.stringify(next)).length > 262144) throw new Error('El contenido completo supera el límite de 256 KB.')
      return next
    }, ({ value, error }) => {
      if (error) setImportError(error.message)
      else { onChange(value); setSource('') }
    })
  }
  const blocks=document.blocks
  const change=(index,patch)=>onChange({version:1,blocks:blocks.map((block,i)=>i===index?{...block,...patch}:block)})
  const move=(index,offset)=>{const next=[...blocks];[next[index],next[index+offset]]=[next[index+offset],next[index]];onChange({version:1,blocks:next})}
  const mark=(event,index,marker)=>{const input=event.currentTarget.closest('section').querySelector('textarea');const start=input.selectionStart,end=input.selectionEnd;change(index,{text:input.value.slice(0,start)+marker+(input.value.slice(start,end)||'texto')+marker+input.value.slice(end)})}
  return <section className="article-block-editor" aria-label="Editor de contenido"><h3>Contenido</h3>
    <details className="article-block-editor__import"><summary>Pegar un artículo ya escrito</summary>
      <p>Pega el cuerpo del artículo. Separa los párrafos con una línea en blanco; puedes usar ## para subtítulos y guiones para listas. Completa el título, las imágenes y el SEO en sus campos.</p>
      <label>Artículo completo<textarea rows={10} maxLength={200000} value={source} onChange={event => setSource(event.target.value)} disabled={importing.pending} /></label>
      <button type="button" disabled={!source.trim() || importing.pending} onClick={() => incorporate(false)}>Añadir texto al contenido</button>
      {blocks.length > 0 && <button type="button" disabled={!source.trim() || importing.pending} onClick={() => incorporate(true)}>Reemplazar todo el contenido con este texto</button>}
      {importing.pending && <ArticleBlockEditorSkeleton />}{importError && <p role="alert">{importError}</p>}
    </details>
    <p>Selecciona texto para aplicar negrita o cursiva. Puedes reordenar los bloques con los botones.</p>{blocks.map((block,index)=><section key={index} aria-label={`Bloque ${index+1}`}><p>{index+1} · {labels[block.type]}</p>
    {'text' in block&&<><label>Texto<textarea rows={block.type==='paragraph'?5:2} value={block.text} onChange={e=>change(index,{text:e.target.value})}/></label>{['paragraph','quote'].includes(block.type)&&<div role="group" aria-label="Formato del texto"><button type="button" onMouseDown={e=>e.preventDefault()} onClick={e=>mark(e,index,'**')}>Negrita</button><button type="button" onMouseDown={e=>e.preventDefault()} onClick={e=>mark(e,index,'_')}>Cursiva</button></div>}</>}
    {block.type==='heading'&&<label>Nivel<select value={block.level} onChange={e=>change(index,{level:Number(e.target.value)})}><option value={2}>Subtítulo</option><option value={3}>Subsección</option></select></label>}
    {block.type==='list'&&<><label>Elementos (uno por línea)<textarea value={block.items.join('\n')} onChange={e=>change(index,{items:e.target.value.split('\n')})}/></label><label><input type="checkbox" checked={block.ordered} onChange={e=>change(index,{ordered:e.target.checked})}/>Lista numerada</label></>}
    {block.type==='link'&&<label>Destino<input value={block.href} onChange={e=>change(index,{href:e.target.value})}/></label>}
    <div className="article-block-editor__actions"><button type="button" disabled={index===0} onClick={()=>move(index,-1)}>Subir bloque</button><button type="button" disabled={index===blocks.length-1} onClick={()=>move(index,1)}>Bajar bloque</button><button type="button" onClick={()=>onChange({version:1,blocks:blocks.filter((_,i)=>i!==index)})}>Quitar bloque</button></div>
  </section>)}<div aria-label="Añadir contenido">{Object.entries(labels).map(([type,label])=><button type="button" key={type} disabled={blocks.length>=200} onClick={()=>onChange({version:1,blocks:[...blocks,type==='list'?{type,items:[''],ordered:false}:type==='link'?{type,text:'',href:''}:type==='separator'?{type}:{type,text:'',...(type==='heading'?{level:2}:{})}]})}>+ {label}</button>)}</div></section>
}
