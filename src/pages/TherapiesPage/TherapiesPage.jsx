import { useSiteContent } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import TherapyCard from '../../components/TherapyCard/TherapyCard.jsx'
import ActionLink from '../../components/ActionLink/ActionLink.jsx'
import './TherapiesPage.css'

export default function TherapiesPage() {
  const { therapies } = useSiteContent()
  return (
    <main id="main-content" className="therapies-page">
      <header className="therapies-page__intro page-wrap">
        <h1>Terapias</h1>
        <p>Conoce los servicios de la consulta. Podemos conversar sobre lo que necesitas y revisar las alternativas de forma individual.</p>
      </header>
      <section className="therapies-page__services" aria-label="Servicios de terapias">
        <div className="therapies-page__grid page-wrap">
          {therapies.map((therapy) => <TherapyCard key={therapy.id} {...therapy} />)}
        </div>
      </section>
      <section className="therapies-page__contact page-wrap" aria-labelledby="therapies-contact-title">
        <div>
          <h2 id="therapies-contact-title">Comencemos por una conversación.</h2>
          <p>Conoce cómo es la atención y cómo consultar disponibilidad.</p>
        </div>
        <ActionLink href="/consulta">Conocer la consulta <span aria-hidden="true">→</span></ActionLink>
      </section>
    </main>
  )
}
