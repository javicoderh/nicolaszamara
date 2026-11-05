import { whatsappLink, contactMessages } from '../../services/contactLinks.js'
import ActionLink from '../../components/ActionLink/ActionLink.jsx'
import InterestForm from '../../components/InterestForm/InterestForm.jsx'
import { trackEvent } from '../../services/analyticsService.js'
import { homeContent } from '../../content/siteContent.js'
import { attentionLocations } from '../../content/attentionLocations.js'
import './ConsultationPage.css'

const questions = [
 { question: '¿Tengo que saber qué terapia necesito?', answer: 'No. Primero conversamos sobre tu motivo de consulta y evaluamos lo que necesitas. Luego te propongo las herramientas que pueden ser adecuadas para tu atención.' },
 { question: '¿Dónde puedo atenderme?', answer: 'En Villa Vida Natural, en Las Condes, o en Centro Médico Evaluz, en Providencia. Puedes indicar tu preferencia al contactarme.' },
 { question: '¿Cómo conozco los valores y la disponibilidad?', answer: 'Escríbeme por WhatsApp e indícame dónde te gustaría atenderte. Te entregaré la información por interno para que podamos coordinar.' },
 { question: '¿Enviar el formulario confirma una hora?', answer: 'No. El formulario permite solicitar una atención. Tu hora queda confirmada cuando acordamos el día y horario por contacto directo.' },
]

export default function ConsultationPage() {
  const whatsappHref = whatsappLink(contactMessages.consultation)

  return (
    <main id="main-content" className="consult-page page-wrap">
      <header className="consult-page__intro">
        <div className="consult-page__photo-frame">
        <img
          className="consult-page__photo"
          src="/photos/consulta-maya-925-960.jpg"
          srcSet="/photos/consulta-maya-925-480.jpg 480w, /photos/consulta-maya-925-960.jpg 960w"
          sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1064px) 42vw, 430px"
          alt="Nicolás Zamara conversando con una persona en su consulta"
          width="960"
          height="1439"
          fetchPriority="high"
        />
        </div>
        <h1 data-analytics-section="consultation_intro">{homeContent.consultation.title}</h1>
      </header>

      <section className="consult-page__steps" aria-labelledby="consult-steps-title">
        <h2 id="consult-steps-title" data-analytics-section="consultation_steps">Cómo comienza</h2>
        <p>{homeContent.consultation.description}</p>
        <p>{homeContent.consultation.additional}</p><ActionLink href={whatsappHref} target="_blank" rel="noreferrer">Consultar disponibilidad</ActionLink>
      </section>

      <section id="lugares-de-atencion" className="consult-page__locations" aria-labelledby="locations-title">
        <h2 id="locations-title">Dónde atiendo</h2>
        <div className="consult-page__location-grid">{attentionLocations.map(location => <article className="consult-page__location" key={location.id}>
          <h3>{location.name}</h3><p><strong>{location.subtitle}</strong></p><p>{location.description}</p><p>Dirección: {location.address}</p>{location.directions && <p>{location.directions}</p>}
          <ActionLink href={whatsappLink(location.message)} target="_blank" rel="noreferrer">{location.button}</ActionLink>
          <ActionLink variant="text" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name + ' ' + location.address)}`} target="_blank" rel="noreferrer">Ver ubicación</ActionLink>
        </article>)}</div>
      </section>

      <section className="consult-page__faq" aria-labelledby="consult-faq-title">
        <h2 id="consult-faq-title" data-analytics-section="consultation_faq">Antes de escribir</h2>
        {questions.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>

      <div id="interes-consulta" className="consult-page__interest">
        <InterestForm kind="consultation" />
      </div>

      <section className="consult-page__contact" aria-labelledby="consult-contact-title">
        <div>
          <h2 id="consult-contact-title" data-analytics-section="consultation_contact">¿Quieres conversar sobre disponibilidad?</h2>
          <p>El contacto sirve para coordinar. No equivale a una reserva confirmada.</p>
        </div>
        {whatsappHref
          ? <ActionLink analytics={{ element_id: 'consultation_whatsapp', placement: 'consultation_contact', service: 'consultation' }} href={whatsappHref} target="_blank" rel="noreferrer" onClick={() => trackEvent('whatsapp_click', { element_id: 'consultation_whatsapp', placement: 'consultation_contact', service: 'consultation' })}>Consultar disponibilidad por WhatsApp <span aria-hidden="true">↗</span></ActionLink>
          : <p className="consult-page__availability" role="status">El contacto por WhatsApp no está disponible en este momento.</p>}
      </section>
    </main>
  )
}
