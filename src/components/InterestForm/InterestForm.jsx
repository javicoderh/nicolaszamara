import { useRef } from 'react'
import { submitInterest as defaultSubmitInterest } from '../../services/interestService.js'
import { useInterestSubmission } from '../../hooks/useInterestSubmission/useInterestSubmission.js'
import './InterestForm.css'

const fieldMap = {
  online: [
    { name: 'name', label: 'Nombre', type: 'text', required: true, autocomplete: 'name' },
    { name: 'email', label: 'Correo electrónico', type: 'email', required: true, autocomplete: 'email' },
    { name: 'country', label: 'País', type: 'text', required: true, autocomplete: 'country-name' },
    { name: 'experience', label: 'Experiencia previa (opcional)', type: 'text', required: false, autocomplete: 'off' },
  ],
  nature: [
    { name: 'name', label: 'Nombre', type: 'text', required: true, autocomplete: 'name' },
    { name: 'email', label: 'Correo electrónico', type: 'email', required: true, autocomplete: 'email' },
    { name: 'city', label: 'Ciudad', type: 'text', required: true, autocomplete: 'address-level2' },
  ],
}

const formCopy = {
  online: { title: 'Flores de Bach en modalidad online', purpose: 'Si te gustaría participar desde tu ciudad o país, déjame tus datos para recibir información cuando se abra una edición online.', success: 'Gracias por tu interés. Te avisaré cuando se abra una edición online.' },
  nature: { title: 'Me interesan los baños de bosque', purpose: 'Déjame tus datos para recibir información cuando se confirme un encuentro.', success: 'Gracias por tu interés. Te avisaré cuando se confirme un encuentro.' },
}

export default function InterestForm({ kind, submitInterest = defaultSubmitInterest }) {
  const { status, submit, reset } = useInterestSubmission(submitInterest)
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
      <h3 id={`${kind}-form-title`}>{copy.title}</h3>
      <p>{copy.purpose} Revisa también la <a href="/privacidad">información de privacidad</a>.</p>
      <form ref={formRef} onSubmit={handleSubmit} aria-busy={status === 'submitting'}>
        <fieldset disabled={status === 'submitting' || status === 'saved'}>
        <legend className="interest-form__legend">Datos para registrar tu interés</legend>
        {fields.map((field) => (
          <label className="interest-form__field" key={field.name}>
            <span>{field.label}{field.required ? ' *' : ''}</span>
            <input name={field.name} type={field.type} autoComplete={field.autocomplete} required={field.required} maxLength={field.name === 'email' ? 254 : field.name === 'experience' ? 500 : field.name === 'name' ? 120 : 100} />
          </label>
        ))}
        <label className="interest-form__consent">
          <input name="privacyConsent" type="checkbox" required />
          <span>Autorizo el uso de mis datos para responder a este interés y he leído la información de privacidad. *</span>
        </label>
        <label className="interest-form__consent">
          <input name="updatesConsent" type="checkbox" />
          <span>Quiero recibir novedades relacionadas con este interés (opcional).</span>
        </label>
        <label className="interest-form__trap" aria-hidden="true">Sitio web<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
        <button className="interest-form__submit" type="submit" disabled={status === 'submitting' || status === 'saved'}>
          {status === 'submitting' ? 'Enviando…' : 'Registrar mi interés'}
        </button>
        </fieldset>
      </form>
      {status === 'submitting' && <p className="interest-form__message" role="status">Estamos guardando tu interés…</p>}
      {status === 'saved' && <p className="interest-form__message" role="status">{copy.success}</p>}
      {status === 'saved' && <button className="interest-form__submit" type="button" onClick={() => { formRef.current?.reset(); reset() }}>Registrar otro interés</button>}
      {status === 'unavailable' && <p className="interest-form__message interest-form__message--error" role="alert">No pudimos confirmar el registro. Inténtalo nuevamente más tarde.</p>}
      {status === 'rate_limited' && <p className="interest-form__message interest-form__message--error" role="alert">Recibimos varios intentos. Espera un minuto antes de reintentar.</p>}
    </section>
  )
}
