import { useCallback, useState } from 'react'
import { useAdminQuery } from '../../hooks/useAdminQuery/useAdminQuery.js'
import { useDelayedOperation } from '../../hooks/useDelayedOperation/useDelayedOperation.js'
import { getAdminSession, adminRequest, adminErrorMessage } from '../../services/adminService.js'
import AdminLogin from '../../components/AdminLogin/AdminLogin.jsx'
import AdminDashboard from '../../components/AdminDashboard/AdminDashboard.jsx'
import AdminPageSkeleton from './AdminPageSkeleton.jsx'
import './AdminPage.css'

export default function AdminPage({ loadSession = getAdminSession }) {
  const session = useAdminQuery(loadSession)
  const [account, setAccount] = useState(undefined)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState(null)
  const remote = useDelayedOperation(15000)
  const expired = useCallback(() => { setAccount(null); setNotice('Tu sesión terminó. Vuelve a ingresar.') }, [])
  const passwordChanged = useCallback(() => { setAccount(null); setNotice('Contraseña actualizada. Ingresa con tu nueva contraseña.') }, [])
  const username = account === undefined ? session.data?.username : account
  const checking = account === undefined && session.pending
  const failed = account === undefined && session.error && session.error.status !== 'unauthorized'
  function logout() {
    setError(null)
    remote.run((signal) => adminRequest({ operation: 'logout' }, signal), ({ error: failure }) => {
      if (failure && failure.status !== 'unauthorized') setError(failure)
      else { setAccount(null); setNotice('Sesión cerrada.') }
    })
  }
  return <main className="admin-page" id="main-content" data-clarity-mask="true">
    <header className="admin-page__header"><a href="/">Nicolás Zamara <span>Administración</span></a>{username && <div><span>{username}</span><button type="button" onClick={logout} disabled={remote.pending}>{remote.pending ? 'Cerrando sesión…' : 'Cerrar sesión'}</button></div>}</header>
    <div className="admin-page__body">
      {checking ? <AdminPageSkeleton /> : failed ? <section role="alert"><p>{adminErrorMessage(session.error)}</p><button type="button" onClick={session.reload}>Reintentar acceso</button></section>
        : username ? <AdminDashboard onExpired={expired} onPasswordChanged={passwordChanged} />
          : <AdminLogin onAuthenticated={setAccount} notice={notice} />}
      {error && <p role="alert">{adminErrorMessage(error)}</p>}
      {remote.pending && <div className="admin-page__logout" role="status" aria-label="Cerrando sesión" aria-busy="true"><AdminPageSkeleton /></div>}
    </div>
  </main>
}
