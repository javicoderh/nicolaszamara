import { useState } from 'react'
import { submitInterest as defaultSubmitInterest } from '../../services/interestService.js'
import { trackEvent } from '../../services/analyticsService.js'
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
  online: { title: 'Interés en formación online', purpose: 'Usaremos estos datos para responder a tu interés en una futura edición online. La fecha aún no está definida.' },
  nature: { title: 'Interés en baños de bosque', purpose: 'Usaremos estos datos para compartir información si se define una actividad. Todavía no hay fechas ni convocatoria.' },
}

export default function InterestForm({ kind, submitInterest = defaultSubmitInterest }) {
  const [status, setStatus] = useState('idle')
  const fields = fieldMap[kind]
  const copy = formCopy[kind]

  if (!fields || !copy) return null

  async function handleSubmit(event) {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    setStatus('submitting')
    const formData = new FormData(event.currentTarget)
    try {
      const result = await submitInterest({
        interest: kind,
        values: Object.fromEntries(formData.entries()),
        updatesConsent: formData.has('updatesConsent'),
      })
      if (result?.status === 'saved') {
        trackEvent(kind === 'online' ? 'online_interest_saved' : 'nature_interest_saved')
        setStatus('saved')
      } else {
        setStatus('unavailable')
      }
    } catch {
      setStatus('unavailable')
    }
  }

  return (
    <section className="interest-form" aria-labelledby={`${kind}-form-title`}>
      <h3 id={`${kind}-form-title`}>{copy.title}</h3>
      <p>{copy.purpose} Revisa también la <a href="/privacidad">información de privacidad</a>.</p>
      <form onSubmit={handleSubmit}>
        {fields.map((field) => (
          <label className="interest-form__field" key={field.name}>
            <span>{field.label}{field.required ? ' *' : ''}</span>
            <input name={field.name} type={field.type} autoComplete={field.autocomplete} required={field.required} />
          </label>
        ))}
        <label className="interest-form__consent">
          <input name="updatesConsent" type="checkbox" />
          <span>Quiero recibir novedades relacionadas con este interés. La forma de retirar esta autorización se informará al habilitar el servicio.</span>
        </label>
        <button className="interest-form__submit" type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Enviando…' : 'Registrar mi interés'}
        </button>
      </form>
      {status === 'saved' && <p className="interest-form__message" role="status">Tu interés quedó registrado. Gracias.</p>}
      {status === 'unavailable' && <p className="interest-form__message interest-form__message--error" role="alert">El registro aún no está habilitado. No se enviaron tus datos; inténtalo más adelante.</p>}
    </section>
  )
}
