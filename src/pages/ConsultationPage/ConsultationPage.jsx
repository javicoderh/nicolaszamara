import { useSiteContent } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import ActionLink from '../../components/ActionLink/ActionLink.jsx'
import { trackEvent } from '../../services/analyticsService.js'
import { homeContent } from '../../content/siteContent.js'
import './ConsultationPage.css'

const questions = [
  { question: '¿Tengo que escoger una técnica antes de consultar?', answer: 'No. El primer paso es conversar y conocer tu necesidad. Las alternativas se revisan a partir de una evaluación individual.' },
  { question: '¿El mensaje por WhatsApp confirma una hora?', answer: 'No. El mensaje inicia una conversación para coordinar disponibilidad; la hora queda confirmada únicamente después de acordarla directamente.' },
  { question: '¿Cuánto dura una sesión y cuánto cuesta?', answer: 'Puedes consultar la duración y el valor de la sesión al coordinar tu atención.' },
]

export default function ConsultationPage() {
  const { contact } = useSiteContent()
  const whatsappHref = contact.whatsappNumber
    ? `https://wa.me/${contact.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quisiera consultar disponibilidad para una sesión.')}`
    : ''

  return (
    <main id="main-content" className="consult-page page-wrap">
      <header className="consult-page__intro">
        <p className="eyebrow">Consulta y terapias</p>
        <h1>{homeContent.consultation.title}</h1>
      </header>

      <section className="consult-page__steps" aria-labelledby="consult-steps-title">
        <h2 id="consult-steps-title">Cómo comienza</h2>
        <p>{homeContent.consultation.description}</p>
        <p>{homeContent.consultation.additional}</p>
      </section>

      <section className="consult-page__details" aria-labelledby="consult-details-title">
        <div>
          <p className="eyebrow">Información práctica</p>
          <h2 id="consult-details-title">Cada consulta, con claridad desde el inicio.</h2>
          <p>Puedes consultar la ubicación, accesibilidad, horarios, duración y valores al coordinar tu atención.</p>
        </div>
        <dl>
          <div><dt>Ubicación</dt><dd>{contact.address || 'Consulta al coordinar tu atención'}</dd></div>
          <div><dt>Accesibilidad</dt><dd>{contact.accessibility || 'Consulta al coordinar tu atención'}</dd></div>
          <div><dt>Horarios</dt><dd>{contact.hours || 'Consulta al coordinar tu atención'}</dd></div>
          <div><dt>Duración</dt><dd>{contact.sessionDuration || 'Consulta al coordinar tu atención'}</dd></div>
          <div><dt>Valor</dt><dd>{contact.sessionPrice || 'Consulta al coordinar tu atención'}</dd></div>
        </dl>
      </section>

      <section className="consult-page__faq" aria-labelledby="consult-faq-title">
        <p className="eyebrow">Preguntas frecuentes</p>
        <h2 id="consult-faq-title">Antes de escribir</h2>
        {questions.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>

      <section className="consult-page__contact" aria-labelledby="consult-contact-title">
        <div>
          <p className="eyebrow">Primer paso</p>
          <h2 id="consult-contact-title">¿Quieres conversar sobre disponibilidad?</h2>
          <p>El contacto sirve para coordinar. No equivale a una reserva confirmada.</p>
        </div>
        {whatsappHref
          ? <ActionLink href={whatsappHref} target="_blank" rel="noreferrer" onClick={() => trackEvent('whatsapp_click')}>Consultar disponibilidad por WhatsApp <span aria-hidden="true">↗</span></ActionLink>
          : <p className="review-note" role="status">El contacto por WhatsApp no está disponible en esta versión de pruebas.</p>}
      </section>
    </main>
  )
}
