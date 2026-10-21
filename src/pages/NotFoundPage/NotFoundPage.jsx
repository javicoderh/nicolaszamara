import './NotFoundPage.css'
import ActionLink from '../../components/ActionLink/ActionLink.jsx'

export default function NotFoundPage() {
  return (
    <main id="main-content" className="not-found-page">
      <p className="eyebrow">404 · Página no encontrada</p>
      <h1>Este camino todavía no está en el mapa.</h1>
      <p>Puede que el enlace haya cambiado. Puedes volver al inicio y explorar desde ahí.</p>
      <ActionLink href="/">Volver al inicio <span aria-hidden="true">→</span></ActionLink>
    </main>
  )
}
