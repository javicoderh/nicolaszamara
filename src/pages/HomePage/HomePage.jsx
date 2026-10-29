import InterestForm from '../../components/InterestForm/InterestForm.jsx'
import ActionLink from '../../components/ActionLink/ActionLink.jsx'
import AreaGrid from '../../components/AreaGrid/AreaGrid.jsx'
import { homeContent, aboutContent, natureContent } from '../../content/siteContent.js'
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
            <ActionLink href="/naturaleza" variant="text">Reconecta con la naturaleza <span aria-hidden="true">→</span></ActionLink>
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
          <ActionLink className="home-course__secondary" href="/cursos#interes-online" variant="text">Me interesa la modalidad online</ActionLink>
        </div>
        <img
          className="home-course__photo"
          src="/photos/presentacion-botanica-1280.jpg"
          srcSet="/photos/presentacion-botanica-640.jpg 640w, /photos/presentacion-botanica-1280.jpg 1280w"
          sizes="(max-width: 640px) calc(100vw - 40px), 40vw"
          alt="Presentación de botánica con una flor amarilla proyectada en pantalla"
          width="1280"
          height="960"
          loading="lazy"
          decoding="async"
        />
      </section>

      <section className="home-about page-wrap" id="sobre-mi" aria-labelledby="about-title">
        <img
          className="home-about__photo"
          src="/photos/sobre-mi-maya-844-960.jpg"
          srcSet="/photos/sobre-mi-maya-844-480.jpg 480w, /photos/sobre-mi-maya-844-960.jpg 960w"
          sizes="(max-width: 640px) calc(100vw - 40px), 420px"
          alt="Nicolás Zamara sentado en un jardín"
          width="960"
          height="1439"
          loading="lazy"
          decoding="async"
        />
        <div className="home-about__copy">
          <h2 id="about-title">{aboutContent.title}</h2>
          {aboutContent.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
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
          <p className="home-nature__label">Naturaleza y bienestar</p>
          <h2 id="nature-title">{natureContent.title}</h2>
          {natureContent.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <ActionLink href="#interes-naturaleza">Me interesan los baños de bosque</ActionLink>
        </div>
      </section>

      <section className="home-interest page-wrap" id="interes-naturaleza" aria-label="Registro de interés en naturaleza">
        <InterestForm kind="nature" />
      </section>
    </main>
  )
}
