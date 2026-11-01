import { useState } from 'react'
import './AnalyticsConsent.css'

export default function AnalyticsConsent({ consent, onSave, onClose }) {
  const [configure, setConfigure] = useState(false)
  const [analytics, setAnalytics] = useState(consent.analytics)
  const [experience, setExperience] = useState(consent.experience)
  return <section className="analytics-consent" aria-labelledby="analytics-consent-title" data-clarity-mask="true">
    <h2 id="analytics-consent-title">Tus preferencias de privacidad</h2>
    <p>Con tu permiso podemos medir qué secciones son útiles y observar cómo se usa la página para mejorarla.
      Puedes rechazar estas herramientas y seguir consultando nuestros servicios. <a href="/privacidad">Más información</a>.</p>
    {configure && <fieldset>
      <legend>Elige qué permites</legend>
      <label><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />Analítica de navegación y conversiones</label>
      <label><input type="checkbox" checked={experience} onChange={(event) => setExperience(event.target.checked)} />Mapas de interacción y reconstrucción de sesiones con contenido protegido</label>
      <p>Estas preferencias son independientes de las autorizaciones para contactarte y enviarte novedades.</p>
    </fieldset>}
    <div className="analytics-consent__actions">
      <button type="button" onClick={() => onSave({ analytics: false, experience: false })}>Rechazar opcionales</button>
      <button type="button" onClick={() => onSave({ analytics: true, experience: true })}>Aceptar opcionales</button>
      {configure
        ? <button type="button" onClick={() => onSave({ analytics, experience })}>Guardar preferencias</button>
        : <button type="button" onClick={() => setConfigure(true)}>Configurar</button>}
      {consent.status !== 'unknown' && <button type="button" onClick={onClose}>Cerrar preferencias</button>}
    </div>
  </section>
}
