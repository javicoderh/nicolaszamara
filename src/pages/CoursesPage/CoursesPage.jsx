import InterestForm from '../../components/InterestForm/InterestForm.jsx'
import ActionLink from '../../components/ActionLink/ActionLink.jsx'
import PhotoPlaceholder from '../../components/PhotoPlaceholder/PhotoPlaceholder.jsx'
import { useSiteContent } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import { homeContent } from '../../content/siteContent.js'
import { trackEvent } from '../../services/analyticsService.js'
import './CoursesPage.css'

export default function CoursesPage() {
  const { courseUrl } = useSiteContent()
  return (
    <main id="main-content" className="courses-page">
      <header className="courses-page__intro page-wrap">
        <p className="eyebrow">Cursos y formación</p>
        <h1>Aprender para acompañar con más atención.</h1>
        <p>Una formación para acercarse a las Flores de Bach desde la vida cotidiana, con un uso responsable y respeto por la autonomía de cada persona.</p>
      </header>

      <section className="courses-page__course page-wrap" aria-labelledby="bach-title">
        <div className="courses-page__course-copy">
          <p className="eyebrow">Curso disponible</p>
          <h2 id="bach-title">{homeContent.course.title}</h2>
          <p>{homeContent.course.description}</p>
          <ul>
            <li>Su propósito es acercar las esencias florales a situaciones de la vida cotidiana.</li>
            <li>Compartir conocimientos con personas cercanas requiere escuchar y respetar sus decisiones.</li>
            <li>La información sobre fechas, precio, formato e inclusiones se mantiene en la página de inscripción.</li>
          </ul>
          <ActionLink href={courseUrl} target="_blank" rel="noreferrer" onClick={() => trackEvent('hotmart_click')}>Ver curso e inscripción <span aria-hidden="true">↗</span></ActionLink>
        </div>
        <PhotoPlaceholder orientation="landscape" label="Fotografía original del curso Flores de Bach o sus materiales pendiente de entrega" />
      </section>

      <section className="courses-page__online" id="interes-online">
        <div className="page-wrap courses-page__online-inner">
          <div>
            <p className="eyebrow">Próximamente</p>
            <h2>Una futura modalidad online, para público hispanohablante.</h2>
            <p>Estamos reuniendo interés para orientar el desarrollo de una nueva edición. Aún no hay fechas ni matrícula abierta.</p>
          </div>
          <InterestForm kind="online" />
        </div>
      </section>
    </main>
  )
}
