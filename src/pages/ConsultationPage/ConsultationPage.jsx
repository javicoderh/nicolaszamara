import { useSiteContent } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import ActionLink from '../../components/ActionLink/ActionLink.jsx'
import { trackEvent } from '../../services/analyticsService.js'
import './ConsultationPage.css'

const questions = [
  { question: '¿Tengo que escoger una técnica antes de consultar?', answer: 'No. El primer paso es conversar y conocer tu necesidad. Las alternativas se revisan a partir de una evaluación individual.' },
  { question: '¿El mensaje por WhatsApp confirma una hora?', answer: 'No. El mensaje inicia una conversación para coordinar disponibilidad; la hora queda confirmada únicamente después de acordarla directamente.' },
  { question: '¿Cuánto dura una sesión y cuánto cuesta?', answer: 'La duración y los valores vigentes están pendientes de confirmación. Se publicarán aquí una vez revisados.' },
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
        <h1>Un espacio para comenzar por lo que necesitas hoy.</h1>
        <p>La atención parte con una conversación. El primer encuentro permite escuchar tu motivo de consulta y comprender, junto contigo, qué tipo de acompañamiento puede ser adecuado.</p>
      </header>

      <section className="consult-page__steps" aria-labelledby="consult-steps-title">
        <h2 id="consult-steps-title">Cómo comienza</h2>
        <ol>
          <li><strong>Nos ponemos en contacto.</strong> Puedes consultar disponibilidad sin elegir una técnica por adelantado.</li>
          <li><strong>Conversamos.</strong> El primer encuentro considera tu motivo de consulta, tus preguntas y el contexto que quieras compartir.</li>
          <li><strong>Evaluamos juntos.</strong> Las alternativas se revisan de forma individual y se explican antes de acordar cómo continuar.</li>
        </ol>
      </section>

      <section className="consult-page__details" aria-labelledby="consult-details-title">
        <div>
          <p className="eyebrow">Información práctica</p>
          <h2 id="consult-details-title">Cada consulta, con claridad desde el inicio.</h2>
          <p>La ubicación, accesibilidad, horarios, duración y valores vigentes se añadirán cuando Nicolás los confirme.</p>
        </div>
        <dl>
          <div><dt>Ubicación</dt><dd>{contact.address || 'Pendiente de confirmación'}</dd></div>
          <div><dt>Accesibilidad</dt><dd>{contact.accessibility || 'Información pendiente de confirmación'}</dd></div>
          <div><dt>Horarios</dt><dd>{contact.hours || 'Pendientes de confirmación'}</dd></div>
          <div><dt>Duración</dt><dd>{contact.sessionDuration || 'Pendiente de confirmación'}</dd></div>
          <div><dt>Valor</dt><dd>{contact.sessionPrice || 'Pendiente de confirmación'}</dd></div>
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
          : <p className="review-note" role="status">El número de WhatsApp está pendiente de confirmación. No hay un enlace de contacto activo.</p>}
      </section>
    </main>
  )
}
