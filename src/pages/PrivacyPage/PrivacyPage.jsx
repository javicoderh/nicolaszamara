import { privacyCopy } from '../../content/siteContent.js'
import './PrivacyPage.css'

export default function PrivacyPage() {
  return (
    <main id="main-content" className="privacy-page page-wrap">
      <p className="eyebrow">Información legal</p>
      <h1>Privacidad</h1>
      <p className="privacy-page__lead">Esta página informa cómo se tratarán los datos cuando los formularios estén habilitados.</p>
      <p className="privacy-page__draft" role="status">{privacyCopy.status}</p>
      <div className="privacy-page__sections">
        {privacyCopy.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
      <p className="privacy-page__contact">Correo para consultas: pendiente de confirmación.</p>
    </main>
  )
}
