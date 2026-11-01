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
          <p className="nature-page__label">Naturaleza y bienestar</p>
          <h1 id="nature-title" data-analytics-section="nature_intro">{natureContent.title}</h1>
          {natureContent.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <ActionLink analytics={{ element_id: 'nature_interest', placement: 'nature_intro', service: 'nature' }} href="#interes-naturaleza">Me interesan los baños de bosque</ActionLink>
        </div>
      </section>

      <section className="nature-page__interest page-wrap" id="interes-naturaleza" aria-label="Registro de interés en naturaleza">
        <InterestForm kind="nature" placement="nature_page_form" />
      </section>
    </main>
  )
}
