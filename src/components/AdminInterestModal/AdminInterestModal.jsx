import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAdminQuery } from '../../hooks/useAdminQuery/useAdminQuery.js'
import { getAdminInterest, markAdminInterestRead, adminErrorMessage } from '../../services/adminService.js'
import { useDelayedOperation } from '../../hooks/useDelayedOperation/useDelayedOperation.js'
import { adminDate, interestLabels, preferenceLabels, managementLabels, sourceLabel } from '../../services/adminFormatting.js'
import AdminInterestModalSkeleton from './AdminInterestModalSkeleton.jsx'
import './AdminInterestModal.css'

const consent = (value) => value === true ? 'Sí' : value === false ? 'No' : 'Sin registro'

export default function AdminInterestModal({ id, onClose, onExpired, onRead, load = getAdminInterest, markRead = markAdminInterestRead }) {
  const ref = useRef(null)
  const query = useAdminQuery(load, id)
  const operation = useDelayedOperation(15000)
  const [readAt, setReadAt] = useState(null)
  const [saveError, setSaveError] = useState(null)
  function markAsRead() {
    setSaveError(null)
    operation.run((signal) => markRead(id, signal), ({ value, error }) => {
      if (error?.status === 'unauthorized') onExpired()
      else if (error) setSaveError(error)
      else { setReadAt(value.read_at); onRead?.() }
    })
  }
  useEffect(() => {
    const previous = document.activeElement
    const dialog = ref.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => { dialog.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus() }
  }, [])
  useEffect(() => { if (query.error?.status === 'unauthorized') onExpired() }, [query.error, onExpired])
  const record = query.data?.record
  const effectiveReadAt = readAt || record?.read_at
  const fields = record ? [
    ['Nombre', record.full_name], ['Interés', interestLabels[record.interest] || record.interest],
    ['Registrado', adminDate(record.created_at)], ['Correo', record.email], ['Teléfono', record.phone],
    ['Preferencia de contacto', preferenceLabels[record.contact_preference] || record.contact_preference],
    ['Canal registrado', preferenceLabels[record.contact_channel] || record.contact_channel],
    ['País', record.country], ['Ciudad', record.city], ['Experiencia', record.experience],
    ['Origen', sourceLabel(record.source)], ['Página de origen', record.source_path],
    ['Estado de gestión', managementLabels[record.management_status] || record.management_status],
    ['Lectura', effectiveReadAt ? 'Leído' : 'Nuevo'], ['Fecha de lectura', adminDate(effectiveReadAt)],
    ['Autoriza privacidad', consent(record.privacy_consent)], ['Versión de privacidad', record.privacy_version],
    ['Fecha de autorización', adminDate(record.privacy_accepted_at)],
    ['Autoriza contacto', consent(record.contact_consent)], ['Fecha de contacto autorizado', adminDate(record.contact_accepted_at)],
    ['Autoriza novedades', consent(record.updates_consent)], ['Identificador', record.id],
  ] : []
  return createPortal(<dialog ref={ref} className="admin-interest-modal" aria-labelledby="interest-detail-title"
    onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="admin-interest-modal__content">
      <header><div><p>Solicitud de contacto</p><h2 id="interest-detail-title">Detalle del interés</h2></div><button type="button" onClick={onClose} aria-label="Cerrar detalle">×</button></header>
      <p className="admin-interest-modal__timezone">Fechas en horario de Chile.</p>
      {query.pending && <AdminInterestModalSkeleton />}
      {query.error && <div role="alert"><p>{adminErrorMessage(query.error)}</p><button type="button" onClick={query.reload}>Reintentar detalle</button></div>}
      {record && !query.pending && <section className="admin-interest-modal__reading" aria-label="Lectura del interés" aria-busy={operation.pending}>
        <p>{effectiveReadAt ? 'Este interés ya está leído y no aparece en Nuevos.' : 'Cuando termines de revisarlo, márcalo como leído para quitarlo de Nuevos.'}</p>
        <button type="button" onClick={markAsRead} disabled={operation.pending || Boolean(effectiveReadAt)}>{effectiveReadAt ? 'Leído' : 'Marcar como leído'}</button>
        {operation.pending && <AdminInterestModalSkeleton compact label="Guardando lectura" />}
        {saveError && <p role="alert">{adminErrorMessage(saveError)}</p>}
        {readAt && <p role="status">Interés marcado como leído.</p>}
      </section>}
      {record && !query.pending && <dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Sin registro'}</dd></div>)}</dl>}
    </div>
  </dialog>, document.body)
}
