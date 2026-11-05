import { whatsappLink, contactMessages } from '../../services/contactLinks.js'
import InterestForm from '../../components/InterestForm/InterestForm.jsx'
import ActionLink from '../../components/ActionLink/ActionLink.jsx'
import { natureContent } from '../../content/siteContent.js'
import './NaturePage.css'

export default function NaturePage() {
  return (
    <main id="main-content" className="nature-page">
      <section className="nature-page__hero" id="naturaleza" aria-labelledby="nature-title">
        <div className="nature-page__photo-frame">
          <img
            className="nature-page__photo"
            src="/photos/contemplando-1200.jpg"
            srcSet="/photos/contemplando-600.jpg 600w, /photos/contemplando-1200.jpg 1200w"
            sizes="(max-width: 640px) 100vw, 50vw"
            alt="Una persona contemplando un lago turquesa rodeado de montañas nevadas"
            width="1200"
            height="800"
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div className="nature-page__copy">
          <h1 id="nature-title" data-analytics-section="nature_intro">{natureContent.title}</h1>
          {natureContent.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <ActionLink analytics={{ element_id: 'nature_interest', placement: 'nature_intro', service: 'nature' }} href={whatsappLink(contactMessages.nature)} target="_blank" rel="noreferrer">Consultar por baños de bosque</ActionLink>
        </div>
      </section>

      <section className="nature-page__experience page-wrap"><h2>¿Qué hacemos durante la experiencia?</h2><p>Nos damos tiempo para observar, escuchar y percibir el entorno, sin la exigencia de llegar rápido a un destino. Combinamos movimiento suave, pausas y momentos de reflexión.</p><p>No es una actividad orientada al rendimiento deportivo. Antes de participar, podemos conversar sobre tus necesidades de movilidad y las características del lugar.</p><p>La idea es que también te lleves herramientas sencillas para cultivar este vínculo con la naturaleza en tu vida cotidiana.</p><h2>Consulta por las jornadas de baños de bosque</h2><p>Escríbeme para conocer las opciones de participación, las características de las jornadas y consultar por fechas.</p><ActionLink href={whatsappLink(contactMessages.nature)} target="_blank" rel="noreferrer">Consultar por baños de bosque</ActionLink></section>
      <section className="nature-page__interest page-wrap" id="interes-naturaleza" aria-label="Registro de interés en naturaleza">
        <InterestForm kind="nature" placement="nature_page_form" />
      </section>
    </main>
  )
}
