import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import './AdminModal.css'
import AdminIcon from '../AdminIcon/AdminIcon.jsx'

const locks = new Set()
let originalOverflow = ''

export default function AdminModal({ title, children, onClose, open = true, contentClassName = '', closeLabel = 'Cerrar ventana', icon = 'article' }) {
  const ref = useRef(null)
  const pointerOutside = useRef(null)
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const dialog = ref.current
    const previous = document.activeElement
    if (!locks.size) originalOverflow = document.body.style.overflow
    locks.add(dialog)
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    dialog.querySelector('button')?.focus({ preventScroll: true })
    return () => {
      dialog.close()
      locks.delete(dialog)
      if (!locks.size) document.body.style.overflow = originalOverflow
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [open])
  if (typeof document === 'undefined') return null
  return createPortal(<dialog ref={ref} className="admin-modal" aria-labelledby={titleId} data-clarity-mask="true"
    onCancel={event => { event.preventDefault(); onClose() }}
    onPointerDown={event => { pointerOutside.current = event.target === event.currentTarget }}
    onClick={event => { if (event.target === event.currentTarget && pointerOutside.current !== false) onClose(); pointerOutside.current = null }}>
    <div className="admin-modal__surface">
      <header className="admin-modal__header"><h2 id={titleId}><AdminIcon name={icon}/> {title}</h2><button type="button" onClick={onClose} aria-label={closeLabel}>Cerrar <AdminIcon name="close"/></button></header>
      <div className={`admin-modal__content ${contentClassName}`}>{children}</div>
    </div>
  </dialog>, document.body)
}
