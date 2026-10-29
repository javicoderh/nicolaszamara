import { privacyCopy } from '../../content/siteContent.js'
import './PrivacyPage.css'

export default function PrivacyPage() {
  return (
    <main id="main-content" className="privacy-page page-wrap">
      <h1>Privacidad</h1>
      <p className="privacy-page__lead">Aquí puedes conocer cómo se utilizan los datos que compartes en los formularios de interés.</p>
      <p className="privacy-page__review-notice">Versión de pruebas: utiliza datos ficticios en los formularios. La información de privacidad está pendiente de revisión antes del lanzamiento definitivo.</p>
      <div className="privacy-page__sections">
        {privacyCopy.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  )
}
