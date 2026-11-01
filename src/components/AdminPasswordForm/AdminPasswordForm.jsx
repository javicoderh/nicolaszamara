import { useState } from 'react'
import { useDelayedOperation } from '../../hooks/useDelayedOperation/useDelayedOperation.js'
import { adminRequest, adminErrorMessage } from '../../services/adminService.js'
import AdminPasswordFormSkeleton from './AdminPasswordFormSkeleton.jsx'
import './AdminPasswordForm.css'

export default function AdminPasswordForm({ onChanged, onExpired, request = adminRequest }) {
  const remote = useDelayedOperation(15000)
  const [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    if (fields.get('newPassword') !== fields.get('confirmation')) { setError('Las contraseñas nuevas no coinciden.'); return }
    setError('')
    remote.run((signal) => request({ operation: 'password', currentPassword: fields.get('currentPassword'), newPassword: fields.get('newPassword') }, signal), ({ error: failure }) => {
      if (failure?.status === 'unauthorized') onExpired()
      else if (failure) setError(adminErrorMessage(failure))
      else onChanged()
    })
  }
  return <section className="admin-password" aria-labelledby="admin-password-title">
    <h2 id="admin-password-title">Cambiar contraseña</h2>
    <p>Usa entre 12 y 128 caracteres. El cambio cerrará todas las sesiones, incluida esta.</p>
    <form onSubmit={submit} aria-busy={remote.pending}>
      <fieldset disabled={remote.pending}>
        <legend>Actualizar acceso</legend>
        <label>Contraseña actual<input type="password" name="currentPassword" autoComplete="current-password" required maxLength={128} /></label>
        <label>Nueva contraseña<input type="password" name="newPassword" autoComplete="new-password" required minLength={12} maxLength={128} /></label>
        <label>Confirmar nueva contraseña<input type="password" name="confirmation" autoComplete="new-password" required minLength={12} maxLength={128} /></label>
        <button type="submit">Guardar contraseña</button>
      </fieldset>
    </form>
    {remote.pending && <AdminPasswordFormSkeleton />}
    {error && <p role="alert">{error}</p>}
  </section>
}
