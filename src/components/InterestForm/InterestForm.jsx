import { useRef } from 'react'
import { submitInterest as defaultSubmitInterest } from '../../services/interestService.js'
import { useInterestSubmission } from '../../hooks/useInterestSubmission/useInterestSubmission.js'
import ContactPreference from '../ContactPreference/ContactPreference.jsx'
import './InterestForm.css'
import { useFormMetrics } from '../../hooks/useFormMetrics/useFormMetrics.js'
import { formPlacement } from '../../services/formMetrics.js'
import { useHydrated } from '../../contexts/HydrationContext/HydrationContext.jsx'
import { locationLabels } from '../../content/attentionLocations.js'
import { whatsappLink, contactMessages } from '../../services/contactLinks.js'

const phoneField = { name: 'phone', label: 'Teléfono con prefijo internacional', type: 'tel', required: true, autocomplete: 'tel' }
const fieldMap = {
  consultation: [
    { name: 'name', label: 'Nombre', type: 'text', required: true, autocomplete: 'name' },
    { name: 'email', label: 'Correo electrónico', type: 'email', required: true, autocomplete: 'email' },
    phoneField,
  ],
  online: [
    { name: 'name', label: 'Nombre', type: 'text', required: true, autocomplete: 'name' },
    { name: 'email', label: 'Correo electrónico', type: 'email', required: true, autocomplete: 'email' },
    phoneField,
    { name: 'country', label: 'País', type: 'text', required: true, autocomplete: 'country-name' },
    { name: 'experience', label: 'Experiencia previa (opcional)', type: 'text', required: false, autocomplete: 'off' },
  ],
  nature: [
    { name: 'name', label: 'Nombre', type: 'text', required: true, autocomplete: 'name' },
    { name: 'email', label: 'Correo electrónico', type: 'email', required: true, autocomplete: 'email' },
    phoneField,
    { name: 'city', label: 'Ciudad', type: 'text', required: true, autocomplete: 'address-level2' },
  ],
}

const formCopy = {
  consultation: { title: 'Solicita tu atención.', purpose: 'Déjame tus datos e indica dónde te gustaría atenderte. Te contactaré para coordinar.', button: 'Solicitar una hora', success: 'Gracias. Tu solicitud fue enviada correctamente. Te contactaré para coordinar tu atención.' },
  online: { title: 'Consulta por formación online.', purpose: 'Escríbeme para consultar las opciones de formación online, sus contenidos y modalidad de participación.', button: 'Solicitar información', success: 'Gracias. Tu solicitud fue enviada correctamente. Te contactaré con la información.' },
  nature: { title: 'Recibe información sobre las jornadas.', purpose: 'Déjame tus datos y te contactaré para contarte sobre las experiencias y sus opciones de participación.', button: 'Solicitar información', success: 'Gracias. Tu solicitud fue enviada correctamente. Te contactaré con la información.' },
}

export default function InterestForm({ kind, submitInterest = defaultSubmitInterest, placement = formPlacement(kind, '/') }) {
  const hydrated = useHydrated()
  const metrics = useFormMetrics({ kind, placement, service: kind, source: 'form' })
  const { status, submit, reset } = useInterestSubmission(submitInterest, metrics)
  const formRef = useRef(null)
  const fields = fieldMap[kind]
  const copy = formCopy[kind]

  if (!fields || !copy) return null

  function handleSubmit(event) {
    event.preventDefault()
    if (status === 'submitting' || status === 'saved') return
    if (!event.currentTarget.reportValidity()) return
    const formData = new FormData(event.currentTarget)
    const values = Object.fromEntries(fields.map((field) => [field.name, formData.get(field.name)]))
    values.contactPreference = formData.get('contactPreference')
    if (kind === 'consultation') values.attentionLocation = formData.get('attentionLocation')
    void submit({
      interest: kind,
      values,
      updatesConsent: formData.has('updatesConsent'),
      privacyConsent: formData.has('privacyConsent'),
      website: formData.get('website') || '',
    })
  }

  return (
    <section className="interest-form" aria-labelledby={`${kind}-form-title`}>
      <h3 id={`${kind}-form-title`} data-analytics-section={placement}>{copy.title}</h3>
      <p>{copy.purpose} Revisa también la <a href="/privacidad">información de privacidad</a>.</p>
      {kind === 'consultation' && <p>Tu hora queda confirmada cuando acordamos el día y horario por contacto directo.</p>}
      <form ref={formRef} onSubmit={handleSubmit} aria-busy={status === 'submitting'} data-clarity-mask="true"
        onFocusCapture={(event) => { if (event.target.name !== 'website') metrics.start() }} onChange={() => metrics.start()}
        onInvalidCapture={(event) => metrics.invalid(event.target)}>
        <fieldset disabled={!hydrated || status === 'submitting' || status === 'saved'}>
        <legend className="interest-form__legend">Datos para registrar tu interés</legend>
        {fields.map((field) => (
          <label className="interest-form__field" key={field.name}>
            <span>{field.label}{field.required ? ' *' : ''}</span>
            <input name={field.name} type={field.type} autoComplete={field.autocomplete} required={field.required}
              pattern={field.name === 'phone' ? '\\+[1-9][0-9 ]{6,24}' : undefined} placeholder={field.name === 'phone' ? '+56 9 1234 5678' : undefined}
              maxLength={field.name === 'phone' ? 30 : field.name === 'email' ? 254 : field.name === 'experience' ? 500 : field.name === 'name' ? 120 : 100} />
          </label>
        ))}
        <ContactPreference />
        {kind === 'consultation' && <label className="interest-form__field"><span>¿Dónde prefieres atenderte? *</span><select name="attentionLocation" required defaultValue=""><option value="">Selecciona una opción</option>{Object.entries(locationLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
        <label className="interest-form__consent">
          <input name="privacyConsent" type="checkbox" required />
          <span>Autorizo el uso de mis datos para responder a este interés según mi preferencia de contacto y he leído la información de privacidad. *</span>
        </label>
        <label className="interest-form__consent">
          <input name="updatesConsent" type="checkbox" />
          <span>Quiero recibir novedades relacionadas con este interés (opcional).</span>
        </label>
        <label className="interest-form__trap" aria-hidden="true">Sitio web<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
        <button className="interest-form__submit" type="submit" disabled={status === 'submitting' || status === 'saved'}>
          {status === 'submitting' ? 'Enviando…' : copy.button}
        </button>
        </fieldset>
      </form>
      <noscript>Para solicitar contacto, visita la página de consulta y utiliza su enlace de WhatsApp.</noscript>
      {status === 'submitting' && <p className="interest-form__message" role="status">Estamos guardando tu interés…</p>}
      {status === 'saved' && <p className="interest-form__message" role="status">{copy.success}</p>}
      {status === 'saved' && <button className="interest-form__submit" type="button" onClick={() => { formRef.current?.reset(); reset() }}>Registrar otro interés</button>}
      {status === 'unavailable' && <p className="interest-form__message interest-form__message--error" role="alert">No pudimos enviar tu solicitud. Puedes intentarlo nuevamente o <a href={whatsappLink(contactMessages[kind])} target="_blank" rel="noreferrer">escribirme directamente por WhatsApp</a>.</p>}
      {status === 'rate_limited' && <p className="interest-form__message interest-form__message--error" role="alert">Recibimos varios intentos. Espera un minuto antes de reintentar.</p>}
    </section>
  )
}
