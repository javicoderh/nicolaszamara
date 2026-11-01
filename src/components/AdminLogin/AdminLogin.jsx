import { useState } from 'react'
import { useDelayedOperation } from '../../hooks/useDelayedOperation/useDelayedOperation.js'
import { adminRequest, adminErrorMessage } from '../../services/adminService.js'
import AdminLoginSkeleton from './AdminLoginSkeleton.jsx'
import './AdminLogin.css'

export default function AdminLogin({ onAuthenticated, notice, request = adminRequest }) {
  const [error, setError] = useState(null)
  const remote = useDelayedOperation(15000)
  function submit(event) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const payload = { operation: 'login', username: values.get('username'), password: values.get('password') }
    setError(null)
    remote.run((signal) => request(payload, signal), ({ value, error: failure }) => {
      if (failure) setError(failure)
      else onAuthenticated(value.username)
    })
  }
  return <section className="admin-login" aria-labelledby="admin-login-title">
    <p className="admin-login__eyebrow">Nicolás Zamara · Administración</p>
    <h1 id="admin-login-title">Un espacio para gestionar tus intereses.</h1>
    <p>Ingresa para revisar las solicitudes de contacto y su información.</p>
    {notice && <p role="status">{notice}</p>}
    <form onSubmit={submit} aria-busy={remote.pending}>
      <fieldset disabled={remote.pending}>
        <legend>Acceso privado</legend>
        <label>Usuario<input name="username" autoComplete="username" required maxLength={80} /></label>
        <label>Contraseña<input name="password" type="password" autoComplete="current-password" required maxLength={128} /></label>
        <button type="submit">Ingresar</button>
      </fieldset>
    </form>
    {remote.pending && <AdminLoginSkeleton />}
    {error && <p role="alert">{adminErrorMessage(error)}</p>}
    <a href="/">Volver al sitio</a>
  </section>
}
