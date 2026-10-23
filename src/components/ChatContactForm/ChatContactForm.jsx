import { useState } from 'react'
import { submitInterest } from '../../services/interestService.js'
import { useContactCapture } from '../../hooks/useContactCapture/useContactCapture.js'
import ContactPreference from '../ContactPreference/ContactPreference.jsx'
import contactConfig from '../../../config/interests/contact.config.json'
import ChatContactFormSkeleton from './ChatContactFormSkeleton.jsx'
import './ChatContactForm.css'

const services = { consultation: 'Consulta y terapias', course: 'Curso actual', online: 'Curso online', nature: 'Naturaleza' }
const preferences = Object.fromEntries(contactConfig.preferences.map(({ value, label }) => [value, label]))

export default function ChatContactForm({ conversationId, initialTopic, onCancel, onSaved, submitContact = submitInterest }) {
  const [service, setService] = useState(initialTopic === 'therapies' ? 'consultation' : services[initialTopic] ? initialTopic : '')
  const [name, setName] = useState('')
  const [preference, setPreference] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [updates, setUpdates] = useState(false)
  const [review, setReview] = useState(false)
  const capture = useContactCapture(submitContact, onSaved)

  function submit(event) {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    if (!review) { setReview(true); return }
    if (!consent) return
    const fields = { source: 'chatbot', interest: service, conversation_id: conversationId,
      values: { name, phone, email, contactPreference: preference }, privacyConsent: true, contactConsent: true, updatesConsent: updates }
    capture.save(fields)
  }

  function edit() {
    setReview(false)
    setConsent(false)
    capture.reset()
  }

  if (capture.status === 'saved') return <p className="chat-contact__saved" role="status">Recibimos tu solicitud. Te contactaremos por el canal que elegiste.</p>
  return <form className="chat-contact" aria-label="Solicitud de contacto" onSubmit={submit}>
    <p>Déjanos tus datos para que podamos contactarte. Este formulario no confirma una reserva.</p>
    <fieldset disabled={capture.pending}>
      <label>Servicio<select required value={service} onChange={(event) => { setService(event.target.value); edit() }}>
        <option value="">Elige un servicio</option>{Object.entries(services).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label>Tu nombre<input required maxLength={120} autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); edit() }} /></label>
      <ContactPreference value={preference} onChange={(event) => { setPreference(event.target.value); edit() }} />
      <label>Número con prefijo internacional<input required type="tel" autoComplete="tel" maxLength={30}
        pattern="\+[1-9][0-9 ]{6,24}" placeholder="+56 9 1234 5678"
        value={phone} onChange={(event) => { setPhone(event.target.value); edit() }} /></label>
      <label>Correo de contacto<input required type="email"
        autoComplete="email" maxLength={254} placeholder="nombre@correo.cl"
        value={email} onChange={(event) => { setEmail(event.target.value); edit() }} /></label>
      {preference === 'video_call' && <p>Usaremos tu correo para coordinar la videollamada. La solicitud no confirma una cita.</p>}
      {review && <div className="chat-contact__review">
        <p>Revisa tu solicitud: {services[service]}, {name}. Preferencia: {preferences[preference]}. Teléfono: {phone}{email ? `. Correo: ${email}` : ''}. Puedes corregir los campos antes de enviar.</p>
        <label className="chat-contact__check"><input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          Autorizo que el equipo de Nicolás Zamara use estos datos para contactarme por el servicio indicado, según la <a href="/privacidad" target="_blank" rel="noreferrer">información de privacidad</a>.</label>
        <label className="chat-contact__check"><input type="checkbox" checked={updates} onChange={(event) => setUpdates(event.target.checked)} />También quiero recibir novedades relacionadas (opcional).</label>
      </div>}
      <div className="chat-contact__buttons"><button type="submit">{review ? 'Solicitar contacto' : 'Revisar solicitud'}</button><button type="button" onClick={onCancel}>Cancelar</button></div>
    </fieldset>
    {capture.pending && <ChatContactFormSkeleton />}
    {capture.status === 'unavailable' && <p role="alert">No pudimos confirmar el registro. Conservamos los campos para que puedas reintentar.</p>}
    {capture.status === 'rate_limited' && <p role="alert">Recibimos varios intentos. Espera un momento antes de reintentar.</p>}
  </form>
}
