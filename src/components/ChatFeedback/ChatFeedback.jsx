import { useId, useRef, useState } from 'react'
import { useDelayedOperation } from '../../hooks/useDelayedOperation/useDelayedOperation.js'
import { submitChatFeedback } from '../../services/chatFeedbackService.js'
import ChatFeedbackSkeleton from './ChatFeedbackSkeleton.jsx'
import './ChatFeedback.css'

export default function ChatFeedback({ requestId, conversationId, submit = submitChatFeedback }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('idle')
  const [values, setValues] = useState({ category: 'irrelevant', question: '', suggestion: '', comment: '', consent: false })
  const submissionId = useRef(null)
  const remote = useDelayedOperation(15000)

  function change(event) {
    const { name, value, checked, type } = event.target
    setValues((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    submissionId.current = null
    setStatus('idle')
  }

  function save(event) {
    event.preventDefault()
    if (remote.pending || !values.consent) return
    submissionId.current ||= crypto.randomUUID()
    remote.run((signal) => submit({ ...values, id: submissionId.current, request_id: requestId,
      conversation_id: conversationId }, { signal }), ({ error, value }) => {
      setStatus(!error && value?.status === 'saved' ? 'saved' : error?.message === 'conflict' ? 'conflict' : 'error')
    })
  }

  if (status === 'saved') return <p className="chat-feedback__saved" role="status">Propuesta guardada para revisión. Se incorporará solo después de aprobarla.</p>
  return <div className="chat-feedback">
    <button type="button" className="chat-feedback__toggle" aria-expanded={open} aria-controls={`${id}-form`}
      onClick={() => setOpen((previous) => !previous)}>Sugerir una mejor respuesta</button>
    {open && <form id={`${id}-form`} aria-label="Proponer mejora de respuesta" onSubmit={save}>
      <p>Ayúdanos a contemplar más casos. Escribe un ejemplo sin nombres, teléfonos, correos ni información clínica.</p>
      <fieldset disabled={remote.pending}>
        <label htmlFor={`${id}-category`}>¿Qué podemos mejorar?</label>
        <select id={`${id}-category`} name="category" value={values.category} onChange={change}>
          <option value="irrelevant">No respondió a la pregunta</option><option value="missing">Falta información</option>
          <option value="unnatural">No siguió la conversación</option><option value="incorrect">La información no es correcta</option>
        </select>
        <label htmlFor={`${id}-question`}>Pregunta o caso que faltó *</label>
        <textarea id={`${id}-question`} name="question" minLength={5} maxLength={500} required rows={2} value={values.question} onChange={change} />
        <label htmlFor={`${id}-suggestion`}>Respuesta que propones *</label>
        <textarea id={`${id}-suggestion`} name="suggestion" minLength={10} maxLength={1000} required rows={3} value={values.suggestion} onChange={change} />
        <label htmlFor={`${id}-comment`}>Comentario para la revisión (opcional)</label>
        <textarea id={`${id}-comment`} name="comment" maxLength={500} rows={2} value={values.comment} onChange={change} />
        <label className="chat-feedback__consent"><input name="consent" type="checkbox" required checked={values.consent} onChange={change} />
          Autorizo guardar este caso, la respuesta del asistente y mi propuesta para revisarlos y mejorar el chatbot. <a href="/privacidad">Privacidad</a>
        </label>
        <button type="submit" disabled={!values.consent}>Guardar propuesta</button>
      </fieldset>
      {remote.pending && <ChatFeedbackSkeleton />}
      {status === 'error' && !remote.pending && <p role="alert">No pudimos confirmar el guardado. Conservamos tu propuesta para reintentar.</p>}
      {status === 'conflict' && !remote.pending && <p role="alert">Esta respuesta ya tiene una propuesta registrada. El equipo la revisará.</p>}
    </form>}
  </div>
}
