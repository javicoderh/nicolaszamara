import InterestForm from '../../components/InterestForm/InterestForm.jsx'
import ActionLink from '../../components/ActionLink/ActionLink.jsx'
import AreaGrid from '../../components/AreaGrid/AreaGrid.jsx'
import PhotoPlaceholder from '../../components/PhotoPlaceholder/PhotoPlaceholder.jsx'
import { homeContent } from '../../content/siteContent.js'
import { useSiteContent } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import { trackEvent } from '../../services/analyticsService.js'
import './HomePage.css'

export default function HomePage() {
  const { courseUrl } = useSiteContent()
  return (
    <main id="main-content" className="home-page">
      <section className="home-hero page-wrap" aria-labelledby="home-title">
        <div className="home-hero__copy">
          <p className="eyebrow">{homeContent.hero.eyebrow}</p>
          <h1 id="home-title">Acompañar los procesos de <em>la vida.</em></h1>
          <p className="home-hero__intro">{homeContent.hero.description}</p>
          <div className="home-hero__actions">
            <ActionLink href="/consulta">Consultar una hora <span aria-hidden="true">↗</span></ActionLink>
            <ActionLink href="/cursos" variant="text">Explorar cursos <span aria-hidden="true">→</span></ActionLink>
          </div>
        </div>
        <PhotoPlaceholder orientation="portrait" label="Fotografía original de Nicolás en consulta pendiente de entrega" />
      </section>

      <section className="home-areas" aria-labelledby="areas-title">
        <div className="page-wrap">
        <div className="home-section-heading">
          <p className="eyebrow">Tres caminos, una misma escucha</p>
          <h2 id="areas-title">¿Por dónde te gustaría comenzar?</h2>
        </div>
        <AreaGrid areas={homeContent.areas} />
        </div>
      </section>

      <section className="home-consult-band">
        <div className="page-wrap home-consult-band__inner">
          <p className="eyebrow">Consulta terapéutica</p>
          <h2>Un primer encuentro comienza con una conversación.</h2>
          <p>Cada proceso es distinto. La evaluación individual nos ayuda a comprender qué necesitas y cómo acompañarte.</p>
          <ActionLink href="/consulta" variant="light">Conocer la consulta <span aria-hidden="true">↗</span></ActionLink>
        </div>
      </section>

      <section className="home-course page-wrap" aria-labelledby="home-course-title">
        <div className="home-course__copy">
          <p className="eyebrow">Curso disponible</p>
          <h2 id="home-course-title">{homeContent.course.title}</h2>
          <p>{homeContent.course.description}</p>
          <ActionLink href={courseUrl} target="_blank" rel="noreferrer" onClick={() => trackEvent('hotmart_click')}>Ver curso e inscripción <span aria-hidden="true">↗</span></ActionLink>
          <ActionLink className="home-course__secondary" href="/cursos#interes-online" variant="text">Recibir información sobre una futura edición online</ActionLink>
        </div>
        <PhotoPlaceholder orientation="landscape" label="Fotografía original del curso o sus materiales pendiente de entrega" />
      </section>

      <section className="home-about page-wrap" id="sobre-mi" aria-labelledby="about-title">
        <div className="home-about__label"><p className="eyebrow">Sobre mí</p><span /></div>
        <div className="home-about__copy">
          <h2 id="about-title">La escucha también se aprende habitando el mundo.</h2>
          <p>Mi camino reúne el trabajo en Medicina China Integrativa y Flores de Bach con una vida de exploración en la naturaleza. Acompaño desde la curiosidad, el respeto por cada proceso y la atención a lo que cada persona necesita.</p>
          <p className="review-note">Credenciales y antecedentes específicos pendientes de revisión y confirmación.</p>
        </div>
      </section>

      <section className="home-nature" id="naturaleza" aria-labelledby="nature-title">
        <PhotoPlaceholder orientation="landscape" label="Fotografía propia de bosques, montañas o ríos pendiente de entrega" />
        <div className="home-nature__copy">
          <p className="eyebrow">Naturaleza y bienestar</p>
          <h2 id="nature-title">Hacer una pausa. Mirar. Sentir el lugar.</h2>
          <p>Desde niño he pasado tiempo en parques como Conguillío y Huerquehue. El montañismo, la alta montaña y la escalada me han llevado a habitar la naturaleza durante semanas. Soy guía de rafting y kayakista. Desde esa experiencia quiero compartir una invitación a estar presentes y abrir los sentidos, sin sentir que debemos saberlo todo sobre el entorno.</p>
          <p className="review-note">Los baños de bosque están en desarrollo. Aún no hay fechas ni actividad disponible.</p>
          <ActionLink href="#interes-naturaleza">Quiero recibir información</ActionLink>
        </div>
      </section>

      <section className="home-interest page-wrap" id="interes-naturaleza" aria-label="Registro de interés en naturaleza">
        <InterestForm kind="nature" />
      </section>
    </main>
  )
}
