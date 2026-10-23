import InterestForm from '../../components/InterestForm/InterestForm.jsx'
import ActionLink from '../../components/ActionLink/ActionLink.jsx'
import AreaGrid from '../../components/AreaGrid/AreaGrid.jsx'
import PhotoPlaceholder from '../../components/PhotoPlaceholder/PhotoPlaceholder.jsx'
import { homeContent } from '../../content/siteContent.js'
import { useSiteContent } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import { trackHotmartClick } from '../../services/hotmartTrackingService.js'
import './HomePage.css'

export default function HomePage() {
  const { courseUrl } = useSiteContent()
  return (
    <main id="main-content" className="home-page">
      <section className="home-hero page-wrap" aria-labelledby="home-title">
        <div className="home-hero__copy">
          <h1 id="home-title">{homeContent.hero.title}</h1>
          <p className="home-hero__intro">{homeContent.hero.description}</p>
          <p className="home-hero__intro">{homeContent.hero.additional}</p>
          <div className="home-hero__actions">
            <ActionLink href="/consulta">Conoce la consulta <span aria-hidden="true">↗</span></ActionLink>
            <ActionLink href="/cursos" variant="text">Explora los cursos <span aria-hidden="true">→</span></ActionLink>
          </div>
        </div>
        <img
          className="home-hero__photo"
          src="/photos/terapias-integrales-960.jpg"
          srcSet="/photos/terapias-integrales-480.jpg 480w, /photos/terapias-integrales-960.jpg 960w"
          sizes="(max-width: 640px) min(360px, calc(100vw - 40px)), 365px"
          alt="Nicolás Zamara conversando en su consulta"
          width="960"
          height="1439"
          fetchPriority="high"
        />
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
          <h2>{homeContent.consultation.title}</h2>
          <p>{homeContent.consultation.description}</p>
          <p>{homeContent.consultation.additional}</p>
          <ActionLink href="/consulta" variant="light">Cómo es la primera consulta <span aria-hidden="true">↗</span></ActionLink>
        </div>
      </section>

      <section className="home-course page-wrap" aria-labelledby="home-course-title">
        <div className="home-course__copy">
          <h2 id="home-course-title">{homeContent.course.title}</h2>
          <p>{homeContent.course.description}</p>
          <p>{homeContent.course.additional}</p>
          <ActionLink href={courseUrl} target="_blank" rel="noreferrer" onClick={() => { void trackHotmartClick('home') }}>Ver el curso e inscribirme <span aria-hidden="true">↗</span></ActionLink>
          <ActionLink className="home-course__secondary" href="/cursos#interes-online" variant="text">Me interesa el curso online</ActionLink>
        </div>
        <PhotoPlaceholder orientation="landscape" />
      </section>

      <section className="home-about page-wrap" id="sobre-mi" aria-labelledby="about-title">
        <div className="home-about__copy">
          <h2 id="about-title">Hola, soy Nicolás.</h2>
          <p>Mi trabajo reúne la Medicina China Integrativa, las Flores de Bach y la enseñanza. Me interesa comprender tu motivo de consulta y conocerte: qué te preocupa, cómo te sientes y qué está pasando en tu vida.</p>
          <p>Desde ahí, integro distintas herramientas y explico cada paso de la atención, para orientarte de manera integral y acompañarte en el cuidado de tu salud.</p>
          <p>Fuera de la consulta, una parte importante de mi vida transcurre entre bosques, montañas y ríos. Ese vínculo también está presente en mi forma de entender y compartir el bienestar.</p>
        </div>
      </section>

      <section className="home-nature" id="naturaleza" aria-labelledby="nature-title">
        <div className="home-nature__photo-frame">
          <img
            className="home-nature__photo"
            src="/photos/contemplando-1200.jpg"
            srcSet="/photos/contemplando-600.jpg 600w, /photos/contemplando-1200.jpg 1200w"
            sizes="(max-width: 640px) 100vw, 50vw"
            alt="Una persona contemplando un lago turquesa rodeado de montañas nevadas"
            width="1200"
            height="800"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="home-nature__copy">
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
