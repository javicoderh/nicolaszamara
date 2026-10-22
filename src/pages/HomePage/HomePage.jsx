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
          <h1 id="home-title">{homeContent.hero.title}</h1>
          <p className="home-hero__intro">{homeContent.hero.description}</p>
          <p className="home-hero__intro">{homeContent.hero.additional}</p>
          <div className="home-hero__actions">
            <ActionLink href="/consulta">Conoce la consulta <span aria-hidden="true">↗</span></ActionLink>
            <ActionLink href="/cursos" variant="text">Explora los cursos <span aria-hidden="true">→</span></ActionLink>
          </div>
        </div>
        <PhotoPlaceholder orientation="portrait" label="Nicolás en consulta" />
      </section>

      <section className="home-areas" aria-labelledby="areas-title">
        <div className="page-wrap">
        <div className="home-section-heading">
          <h2 id="areas-title">¿Por dónde te gustaría comenzar?</h2>
        </div>
        <AreaGrid areas={homeContent.areas} />
        </div>
      </section>

      <section className="home-consult-band">
        <div className="page-wrap home-consult-band__inner">
          <p className="eyebrow">Consulta y terapias</p>
          <h2>{homeContent.consultation.title}</h2>
          <p>{homeContent.consultation.description}</p>
          <p>{homeContent.consultation.additional}</p>
          <ActionLink href="/consulta" variant="light">Cómo es la primera consulta <span aria-hidden="true">↗</span></ActionLink>
        </div>
      </section>

      <section className="home-course page-wrap" aria-labelledby="home-course-title">
        <div className="home-course__copy">
          <p className="eyebrow">Curso disponible</p>
          <h2 id="home-course-title">{homeContent.course.title}</h2>
          <p>{homeContent.course.description}</p>
          <p>{homeContent.course.additional}</p>
          <ActionLink href={courseUrl} target="_blank" rel="noreferrer" onClick={() => trackEvent('hotmart_click')}>Ver el curso e inscribirme <span aria-hidden="true">↗</span></ActionLink>
          <ActionLink className="home-course__secondary" href="/cursos#interes-online" variant="text">Me interesa la modalidad online</ActionLink>
        </div>
        <PhotoPlaceholder orientation="landscape" label="Curso Flores de Bach y sus materiales" />
      </section>

      <section className="home-about page-wrap" id="sobre-mi" aria-labelledby="about-title">
        <div className="home-about__label"><p className="eyebrow">Sobre mí</p><span /></div>
        <div className="home-about__copy">
          <h2 id="about-title">Hola, soy Nicolás.</h2>
          <p>Mi trabajo reúne la Medicina China Integrativa, las Flores de Bach y la enseñanza. Me interesa comprender tu motivo de consulta y conocerte: qué te preocupa, cómo te sientes y qué está pasando en tu vida.</p>
          <p>Desde ahí, integro distintas herramientas y explico cada paso de la atención, para orientarte de manera integral y acompañarte en el cuidado de tu salud.</p>
          <p>Fuera de la consulta, una parte importante de mi vida transcurre entre bosques, montañas y ríos. Ese vínculo también está presente en mi forma de entender y compartir el bienestar.</p>
        </div>
      </section>

      <section className="home-nature" id="naturaleza" aria-labelledby="nature-title">
        <PhotoPlaceholder orientation="landscape" label="Bosques, montañas y ríos" />
        <div className="home-nature__copy">
          <p className="eyebrow">Naturaleza y bienestar</p>
          <h2 id="nature-title">Darte tiempo para estar en la naturaleza.</h2>
          <p>Desde niño pasaba tiempo en parques nacionales como Conguillío, Huerquehue y muchos otros lugares. Después vinieron la alta montaña, la escalada en roca y el aprendizaje de navegar por ríos tranquilos y de aguas bravas. Todo eso me llevó a permanecer semanas inmerso en entornos naturales. Además de mi trabajo como terapeuta, soy guía de rafting y kayakista, y ese vínculo sigue siendo parte importante de mi vida.</p>
          <p>De ahí nace lo que quiero compartir a través de los baños de bosque: detenernos, escuchar, observar y dejar espacio a lo que percibimos. No necesitas conocer el nombre de cada especie para encontrarte con el lugar.</p>
          <p>Si te gustaría participar, puedes dejarme tu contacto para recibir información cuando se confirme el próximo encuentro.</p>
          <ActionLink href="#interes-naturaleza">Me interesan los baños de bosque</ActionLink>
        </div>
      </section>

      <section className="home-interest page-wrap" id="interes-naturaleza" aria-label="Registro de interés en naturaleza">
        <InterestForm kind="nature" />
      </section>
    </main>
  )
}
