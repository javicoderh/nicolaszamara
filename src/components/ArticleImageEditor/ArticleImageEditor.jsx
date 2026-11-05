import { useEffect, useRef, useState } from 'react'
import { useDelayedOperation } from '../../hooks/useDelayedOperation/useDelayedOperation.js'
import { decodeEditorialImage, drawEditorialImage, editorialMediaUrl, uploadBlogImage } from '../../services/blogMediaService.js'
import ArticleImageEditorSkeleton from './ArticleImageEditorSkeleton.jsx'
import './ArticleImageEditor.css'
import AdminIcon from '../AdminIcon/AdminIcon.jsx'

const initialCrop = (aspect) => ({ aspect, x: 50, y: 50, zoom: 1 })
export default function ArticleImageEditor({ label, value = {}, onChange, aspect = 1.5, onExpired }) {
  const [file, setFile] = useState(null)
  const [ready, setReady] = useState(false)
  const [crop, setCrop] = useState(() => initialCrop(aspect))
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const bitmap = useRef(null)
  const canvas = useRef(null)
  const prepare = useDelayedOperation(30000)
  const upload = useDelayedOperation(30000)
  const busy = prepare.pending || upload.pending
  useEffect(() => () => { bitmap.current?.close(); bitmap.current = null }, [])
  useEffect(() => {
    if (ready && bitmap.current && canvas.current) drawEditorialImage(canvas.current, bitmap.current, crop, 600)
  }, [ready, crop])

  function choose(work) {
    setError(''); setNotice(''); setReady(false)
    prepare.run(async (signal) => {
      const selected = await work(signal)
      const image = await decodeEditorialImage(selected)
      if (signal.aborted) { image.close(); throw new DOMException('Aborted', 'AbortError') }
      bitmap.current?.close(); bitmap.current = image
      return selected
    }, ({ value: selected, error: failure }) => {
      if (failure) { setError('No pudimos abrir la imagen. Usa JPEG, PNG o WebP de hasta 8 MB y 20 megapíxeles.'); setFile(null) }
      else { setFile(selected); setCrop(initialCrop(aspect)); setReady(true); setNotice('Vista previa local. La imagen todavía no se ha subido: pulsa «Subir imagen y guardar recorte».') }
    })
  }
  function editCurrent() {
    choose(async (signal) => {
      const response = await fetch(editorialMediaUrl(value.src, true), { signal, credentials: value.src?.startsWith('/') ? 'same-origin' : 'omit', cache: 'no-store' })
      if (response.status === 401) onExpired?.()
      if (!response.ok) throw new Error('unavailable')
      const blob = await response.blob()
      return new File([blob], 'imagen-del-articulo.webp', { type: blob.type })
    })
  }
  function saveImage() {
    setError(''); setNotice('')
    upload.run((signal) => uploadBlogImage(file, signal, crop), ({ value: result, error: failure }) => {
      if (failure) { if (failure.message === 'unauthorized') onExpired?.(); setError('No pudimos guardar la imagen. Conservamos el recorte para reintentar.'); return }
      onChange({ src: result.src,position:{x:crop.x,y:crop.y} }); setNotice('Imagen guardada. Guarda el borrador para asociarla al artículo.')
      setReady(false); setFile(null); bitmap.current?.close(); bitmap.current = null
    })
  }
  return <section className="article-image-editor" aria-label={label}>
    <h3>{label}</h3>
    <p className="article-image-editor__help">Añade tu fotografía, ajusta el encuadre y guarda el recorte. Las imágenes se incorporan después de generar el texto.</p>
    <fieldset disabled={busy}>
      <legend className="article-image-editor__legend">Archivo y encuadre</legend>
      <label>Archivo para {label.toLowerCase()}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const selected = event.target.files?.[0]; if (selected) choose(async () => selected); event.target.value = '' }} /></label>
      {value.src && !ready && <img className="article-image-editor__current" style={{ aspectRatio: aspect }} src={editorialMediaUrl(value.src, true)} alt={value.alt || `Vista previa: ${label.toLowerCase()}`} />}
      {value.src && !ready && <button type="button" onClick={editCurrent}>Ajustar imagen actual</button>}
      {ready && <div className="article-image-editor__crop">
        <canvas ref={canvas} aria-label={`Vista previa del recorte: ${label.toLowerCase()}`} />
        <div className="article-image-editor__sliders">
          <label>Posición horizontal<input type="range" min="0" max="100" value={crop.x} onChange={(event) => setCrop({ ...crop, x: Number(event.target.value) })} /></label>
          <label>Posición vertical<input type="range" min="0" max="100" value={crop.y} onChange={(event) => setCrop({ ...crop, y: Number(event.target.value) })} /></label>
          <label>Acercamiento<input type="range" min="1" max="3" step="0.05" value={crop.zoom} onChange={(event) => setCrop({ ...crop, zoom: Number(event.target.value) })} /></label>
        </div>
        <button type="button" onClick={() => setCrop(initialCrop(aspect))}>Restablecer encuadre</button>
        <button type="button" onClick={saveImage}><AdminIcon name="upload"/> Subir imagen y guardar recorte</button>
        <p className="article-image-editor__help">El ajuste se guarda en una imagen nueva; las versiones anteriores del artículo conservan la suya.</p>
      </div>}
      {!ready && value.src && <p className="article-image-editor__help">Imagen subida y asociada al borrador en edición.</p>}
      <label>Descripción accesible de {label.toLowerCase()}<input maxLength={400} value={value.alt || ''} onChange={(event) => onChange({ alt: event.target.value })} /></label>
      <label>Pie de {label.toLowerCase()} (opcional)<input maxLength={500} value={value.caption || ''} onChange={(event) => onChange({ caption: event.target.value })} /></label>
      {value.src && <button type="button" onClick={() => onChange({ src: '' })}>Quitar imagen del borrador</button>}
    </fieldset>
    {busy && <ArticleImageEditorSkeleton label={upload.pending ? 'Guardando imagen' : 'Preparando imagen'} />}
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
  </section>
}
