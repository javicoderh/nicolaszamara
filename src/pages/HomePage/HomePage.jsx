import { whatsappLink, contactMessages } from '../../services/contactLinks.js'
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
          <h1 id="home-title" data-analytics-section="home_hero">{homeContent.hero.title}</h1>
          <p className="home-hero__intro">{homeContent.hero.description}</p>
          <p className="home-hero__intro">{homeContent.hero.additional}</p>
          <div className="home-hero__actions">
            <ActionLink analytics={{ element_id: 'hero_consultation', placement: 'home_hero', service: 'consultation' }} href="/consulta">Conoce la consulta <span aria-hidden="true">↗</span></ActionLink>
            <ActionLink analytics={{ element_id: 'hero_courses', placement: 'home_hero', service: 'course' }} href="/cursos" variant="text">Explora los cursos <span aria-hidden="true">→</span></ActionLink>
            <ActionLink analytics={{ element_id: 'hero_nature', placement: 'home_hero', service: 'nature' }} href="/naturaleza" variant="text">Baños de bosque <span aria-hidden="true">→</span></ActionLink>
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
          <h2 id="areas-title" data-analytics-section="home_areas">¿Por dónde te gustaría comenzar?</h2>
        </div>
        <AreaGrid areas={homeContent.areas} />
        </div>
      </section>

      <section className="home-consult-band">
        <div className="page-wrap home-consult-band__inner">
          <h2 data-analytics-section="home_consultation">{homeContent.consultation.title}</h2>
          <p>{homeContent.consultation.description}</p>
          <p>{homeContent.consultation.additional}</p>
          <ActionLink analytics={{ element_id: 'home_consultation_details', placement: 'home_consultation', service: 'consultation' }} href="/consulta" variant="light">Cómo es la primera consulta <span aria-hidden="true">↗</span></ActionLink>
        </div>
      </section>

      <section className="home-consult-band"><div className="page-wrap home-consult-band__inner"><h2>Atención en Las Condes y Providencia</h2><p>Te recibo en mi consulta particular en Villa Vida Natural, en Las Condes, y en Centro Médico Evaluz, en Providencia, donde mi atención tiene un foco en salud de la mujer y personas con útero.</p><ActionLink href="/consulta#lugares-de-atencion" variant="light">Ver lugares de atención</ActionLink></div></section>
      <section className="home-course page-wrap" aria-labelledby="home-course-title">
        <div className="home-course__copy">
          <h2 id="home-course-title" data-analytics-section="home_course">{homeContent.course.title}</h2>
          <p>{homeContent.course.description}</p>
          <p>{homeContent.course.additional}</p>
          <ActionLink analytics={{ element_id: 'home_course_hotmart', placement: 'home_course', service: 'course' }} href={courseUrl} target="_blank" rel="noreferrer" onClick={() => { void trackHotmartClick('home', { element_id: 'home_course_hotmart', placement: 'home_course', service: 'course' }) }}>Próximas ediciones e inscripción <span aria-hidden="true">↗</span></ActionLink>
          <ActionLink analytics={{ element_id: 'home_course_online', placement: 'home_course', service: 'online' }} className="home-course__secondary" href={whatsappLink(contactMessages.course)} target="_blank" rel="noreferrer" variant="text">Consultar sobre el curso</ActionLink>
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
          <h2 id="about-title" data-analytics-section="home_about">{aboutContent.title}</h2>
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
          <h2 id="nature-title" data-analytics-section="home_nature">{natureContent.title}</h2>
          {natureContent.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <ActionLink analytics={{ element_id: 'home_nature_interest', placement: 'home_nature', service: 'nature' }} href={whatsappLink(contactMessages.nature)} target="_blank" rel="noreferrer">Consultar por baños de bosque</ActionLink>
        </div>
      </section>

      <section className="home-blog page-wrap" aria-labelledby="home-blog-title"><h2 id="home-blog-title">Hay temas que merecen más tiempo.</h2><p>Lecturas para continuar explorando naturaleza, terapias y bienestar.</p><ActionLink href="/blog" variant="text">Para profundizar: visita el blog <span aria-hidden="true">→</span></ActionLink></section>
      <section className="home-interest page-wrap" id="interes-naturaleza" aria-label="Registro de interés en naturaleza">
        <InterestForm kind="nature" />
      </section>
    </main>
  )
}
