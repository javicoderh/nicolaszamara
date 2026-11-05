import './AdminModule.css'
import { useState } from 'react'
import AdminModal from '../AdminModal/AdminModal.jsx'
import AdminIcon from '../AdminIcon/AdminIcon.jsx'

export function openAdminModule(id) {
  const section = document.getElementById(id)
  if (!section) return
  section.querySelector('[data-module-trigger]')?.click()
}

export default function AdminModule({ id, title, description, children, variant = 'blog', feedback, onActiveChange }) {
  const [open, setOpen] = useState(false)
  function toggle(next) { setOpen(next); onActiveChange?.(next) }
  return <section id={id} className="admin-module">
    <button type="button" data-module-trigger aria-haspopup="dialog" onClick={() => toggle(true)}><span className="admin-module__icon"><AdminIcon name={id}/></span><span className="admin-module__heading">{title}</span><span className="admin-module__description">{description}</span><span className="admin-module__indicator" aria-hidden="true">↗</span></button>
    <AdminModal title={title} icon={id} open={open} onClose={() => toggle(false)} contentClassName={variant === 'interests' ? 'admin-dashboard' : 'admin-blog'}>{feedback}{children}</AdminModal>
  </section>
}
