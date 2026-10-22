import InterestForm from '../../components/InterestForm/InterestForm.jsx'
import ActionLink from '../../components/ActionLink/ActionLink.jsx'
import { useSiteContent } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import { homeContent } from '../../content/siteContent.js'
import { trackEvent } from '../../services/analyticsService.js'
import './CoursesPage.css'

export default function CoursesPage() {
  const { courseUrl } = useSiteContent()
  return (
    <main id="main-content" className="courses-page">
      <header className="courses-page__intro page-wrap">
        <h1>Aprender para acompañar con más atención.</h1>
        <p>Una formación para acercarse a las Flores de Bach desde la vida cotidiana, con un uso responsable y respeto por la autonomía de cada persona.</p>
      </header>

      <section className="courses-page__course page-wrap" aria-labelledby="bach-title">
        <div className="courses-page__course-copy">
          <h2 id="bach-title">{homeContent.course.title}</h2>
          <p>{homeContent.course.description}</p>
          <p>{homeContent.course.additional}</p>
          <div className="courses-page__actions">
            <ActionLink href={courseUrl} target="_blank" rel="noreferrer" onClick={() => trackEvent('hotmart_click')}>Ver el curso e inscribirme <span aria-hidden="true">↗</span></ActionLink>
            <ActionLink href="/cursos#interes-online" variant="text">Me interesa la modalidad online</ActionLink>
          </div>
        </div>
        <div className="courses-page__photo-frame">
        <img
          className="courses-page__photo"
          src="/photos/presentacion-botanica-1280.jpg"
          srcSet="/photos/presentacion-botanica-640.jpg 640w, /photos/presentacion-botanica-1280.jpg 1280w"
          sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1164px) 40vw, 406px"
          alt="Presentación de botánica con una flor amarilla proyectada en pantalla"
          width="1280"
          height="960"
          decoding="async"
        />
        </div>
      </section>

      <section className="courses-page__online" id="interes-online">
        <div className="page-wrap courses-page__online-inner">
          <div>
            <h2>Una futura modalidad online, para público hispanohablante.</h2>
            <p>Si te gustaría participar desde tu ciudad o país, déjame tus datos para recibir información cuando se abra una edición online.</p>
          </div>
          <InterestForm kind="online" />
        </div>
      </section>
    </main>
  )
}
