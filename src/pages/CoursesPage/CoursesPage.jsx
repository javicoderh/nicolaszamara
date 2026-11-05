import { whatsappLink, contactMessages } from '../../services/contactLinks.js'
import InterestForm from '../../components/InterestForm/InterestForm.jsx'
import ActionLink from '../../components/ActionLink/ActionLink.jsx'
import { useSiteContent } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import { homeContent } from '../../content/siteContent.js'
import { trackHotmartClick } from '../../services/hotmartTrackingService.js'
import './CoursesPage.css'

export default function CoursesPage() {
  const { courseUrl } = useSiteContent()
  return (
    <main id="main-content" className="courses-page">
      <header className="courses-page__intro page-wrap">
        <h1 data-analytics-section="courses_intro">Aprender para acompañar con más atención.</h1>
        <p>Una formación para acercarse a las Flores de Bach desde la vida cotidiana, con un uso responsable y respeto por la autonomía de cada persona.</p>
      </header>

      <section className="courses-page__course page-wrap" aria-labelledby="bach-title">
        <div className="courses-page__course-copy">
          <h2 id="bach-title" data-analytics-section="courses_offer">{homeContent.course.title}</h2>
          <p>{homeContent.course.description}</p>
          <p>{homeContent.course.additional}</p>
          <div className="courses-page__actions">
            <ActionLink analytics={{ element_id: 'courses_hotmart', placement: 'courses_offer', service: 'course' }} href={courseUrl} target="_blank" rel="noreferrer" onClick={() => { void trackHotmartClick('course', { element_id: 'courses_hotmart', placement: 'courses_offer', service: 'course' }) }}>Próximas ediciones e inscripción <span aria-hidden="true">↗</span></ActionLink>
            <ActionLink analytics={{ element_id: 'courses_online_interest', placement: 'courses_offer', service: 'online' }} href={whatsappLink(contactMessages.course)} target="_blank" rel="noreferrer" variant="text">Consultar sobre el curso</ActionLink>
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
            <h2>Curso online para público hispanohablante.</h2>
            <p>Escríbeme para consultar las opciones de formación online, sus contenidos y modalidad de participación.</p><ActionLink href={whatsappLink(contactMessages.online)} target="_blank" rel="noreferrer">Consultar modalidad online</ActionLink>
          </div>
          <InterestForm kind="online" />
        </div>
      </section>
    </main>
  )
}
