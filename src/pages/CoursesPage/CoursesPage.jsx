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
          <p>{homeContent.course.additional}</p>
          <ActionLink href={courseUrl} target="_blank" rel="noreferrer" onClick={() => trackEvent('hotmart_click')}>Ver el curso e inscribirme <span aria-hidden="true">↗</span></ActionLink>
          <ActionLink href="/cursos#interes-online" variant="text">Me interesa la modalidad online</ActionLink>
        </div>
        <PhotoPlaceholder orientation="landscape" label="Curso Flores de Bach y sus materiales" />
      </section>

      <section className="courses-page__online" id="interes-online">
        <div className="page-wrap courses-page__online-inner">
          <div>
            <p className="eyebrow">Próximamente</p>
            <h2>Una futura modalidad online, para público hispanohablante.</h2>
            <p>Si te gustaría participar desde tu ciudad o país, déjame tus datos para recibir información cuando se abra una edición online.</p>
          </div>
          <InterestForm kind="online" />
        </div>
      </section>
    </main>
  )
}
