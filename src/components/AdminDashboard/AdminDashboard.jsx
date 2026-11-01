import { useEffect, useState } from 'react'
import { useAdminQuery } from '../../hooks/useAdminQuery/useAdminQuery.js'
import { getAdminInterests, adminErrorMessage } from '../../services/adminService.js'
import { adminDate, interestLabels, preferenceLabels, managementLabels, sourceLabel } from '../../services/adminFormatting.js'
import AdminInterestModal from '../AdminInterestModal/AdminInterestModal.jsx'
import AdminPasswordForm from '../AdminPasswordForm/AdminPasswordForm.jsx'
import AdminDashboardSkeleton from './AdminDashboardSkeleton.jsx'
import './AdminDashboard.css'

export default function AdminDashboard({ onExpired, onPasswordChanged, load = getAdminInterests }) {
  const [mode, setMode] = useState('all')
  const [filters, setFilters] = useState({ mode: 'all', interest: '', reading: 'unread' })
  const [cursors, setCursors] = useState([null])
  const [selected, setSelected] = useState(null)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const key = JSON.stringify({ filters, cursor: cursors.at(-1) })
  const query = useAdminQuery(load, key)
  useEffect(() => { if (query.error?.status === 'unauthorized') onExpired() }, [query.error, onExpired])
  function apply(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (mode === 'range' && form.get('end') < form.get('start')) {
      event.currentTarget.elements.end.setCustomValidity('La fecha final debe ser igual o posterior a la inicial.')
      event.currentTarget.elements.end.reportValidity()
      return
    }
    const next = { mode, interest: form.get('interest'), reading: form.get('reading') }
    if (mode === 'day') next.day = form.get('day')
    if (mode === 'month') next.month = form.get('month')
    if (mode === 'range') { next.start = form.get('start'); next.end = form.get('end') }
    setFilters(next); setCursors([null]); setSelected(null)
    if (JSON.stringify(next) === JSON.stringify(filters) && cursors.length === 1) query.reload()
  }
  const data = query.data
  return <div className="admin-dashboard">
    <section className="admin-dashboard__intro"><div><p className="admin-dashboard__eyebrow">Vista general</p><h1>Intereses recibidos</h1><p>Revisa cada solicitud y encuentra el momento para responder.</p></div>
      <button type="button" aria-expanded={passwordOpen} onClick={() => setPasswordOpen((value) => !value)}>Cambiar contraseña</button></section>
    {passwordOpen && <AdminPasswordForm onChanged={onPasswordChanged} onExpired={onExpired} />}
    <form className="admin-dashboard__filters" onSubmit={apply} aria-label="Filtrar intereses">
      <label>Período<select name="mode" value={mode} onChange={(event) => setMode(event.target.value)}>
        <option value="all">Todo el historial</option><option value="day">Un día</option><option value="month">Un mes</option><option value="range">Rango de fechas</option>
      </select></label>
      {mode === 'day' && <label>Día<input name="day" type="date" required /></label>}
      {mode === 'month' && <label>Mes<input name="month" type="month" required /></label>}
      {mode === 'range' && <><label>Desde<input name="start" type="date" required onChange={(event) => event.currentTarget.form.elements.end.setCustomValidity('')} /></label><label>Hasta<input name="end" type="date" required onChange={(event) => event.currentTarget.setCustomValidity('')} /></label></>}
      <label>Servicio<select name="interest"><option value="">Todos los servicios</option>{Object.entries(interestLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Lectura<select name="reading" defaultValue="unread"><option value="unread">Nuevos (sin leer)</option><option value="read">Leídos</option><option value="all">Todos</option></select></label>
      <button type="submit" disabled={query.pending}>Aplicar filtros</button>
      <button type="button" onClick={() => { setCursors([null]); query.reload() }} disabled={query.pending}>Actualizar</button>
      <p>Fechas en America/Santiago. Los rangos incluyen ambos días.</p>
    </form>
    {query.pending && <AdminDashboardSkeleton />}
    {query.error && <div className="admin-dashboard__error" role="alert"><p>{adminErrorMessage(query.error)}</p><button type="button" onClick={query.reload}>Reintentar carga</button></div>}
    {data && !query.pending && <>
      <section className="admin-dashboard__metrics" aria-label="Resumen de intereses">
        <article><span>Historial completo</span><strong>{data.all_total}</strong></article>
        <article><span>Con los filtros aplicados</span><strong>{data.summary.total}</strong></article>
        {Object.entries(interestLabels).map(([value, label]) => <article key={value}><span>{label}</span><strong>{data.summary[value]}</strong></article>)}
      </section>
      <div className="admin-dashboard__list-heading"><h2>Solicitudes</h2><p>{data.summary.new} nuevas · {data.summary.read || 0} leídas · {data.summary.form} desde formularios · {data.summary.chatbot} desde el asistente</p></div>
      {data.items.length ? <div className="admin-dashboard__table-wrap"><table><caption>Intereses del filtro aplicado, del más reciente al más antiguo</caption><thead><tr><th scope="col">Persona</th><th scope="col">Interés</th><th scope="col">Fecha</th><th scope="col">Origen</th><th scope="col">Contacto</th><th scope="col">Lectura</th><th scope="col">Gestión</th><th scope="col">Detalle</th></tr></thead>
        <tbody>{data.items.map((item) => <tr key={item.id}><td>{item.full_name}</td><td>{interestLabels[item.interest] || item.interest}</td><td>{adminDate(item.created_at)}</td><td>{sourceLabel(item.source)}</td><td>{preferenceLabels[item.contact_preference] || 'Sin registro'}</td><td><span className="admin-dashboard__badge">{item.read_at ? 'Leído' : 'Nuevo'}</span></td><td>{managementLabels[item.management_status] || 'Sin registro'}</td><td><button type="button" onClick={() => setSelected(item.id)} aria-label={`Ver detalle de ${item.full_name}`}>Ver detalle ↗</button></td></tr>)}</tbody></table></div>
        : <p className="admin-dashboard__empty" role="status">No hay intereses para los filtros seleccionados.</p>}
      <nav className="admin-dashboard__pagination" aria-label="Páginas de intereses">
        <button type="button" disabled={cursors.length === 1} onClick={() => setCursors((values) => values.slice(0, -1))}>Anterior</button>
        <span>Página {cursors.length} · hasta 20 solicitudes por página</span>
        <button type="button" disabled={!data.next_cursor} onClick={() => setCursors((values) => [...values, data.next_cursor])}>Siguiente</button>
      </nav>
    </>}
    {selected && <AdminInterestModal key={selected} id={selected} onClose={() => setSelected(null)} onExpired={onExpired} onRead={() => { setCursors([null]); query.reload() }} />}
  </div>
}
