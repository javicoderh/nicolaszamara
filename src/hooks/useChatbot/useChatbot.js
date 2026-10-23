import { useRef, useState } from 'react'
import { useDelayedOperation } from '../useDelayedOperation/useDelayedOperation.js'
import { chatbotApi } from '../../services/chatbotService.js'

const welcome = { role: 'assistant', content: 'Hola, podemos orientarte sobre nuestras consultas, terapias, cursos y actividades en la naturaleza. Cuéntanos, ¿en qué podemos ayudarte?' }
const notices = {
  invalid_response: 'No pudimos conectar con el servicio de conversación. Conservamos tu borrador; pulsa Recuperar estado para reintentar.',
  not_configured: 'El asistente todavía no está configurado. Puedes explorar los servicios o solicitar contacto.',
  storage_unavailable: 'No pudimos recuperar la conversación. Puedes reintentar o explorar nuestros servicios.',
  conversation_closed: 'Podemos seguir en contacto a través del formulario. También puedes explorar nuestros servicios.',
  attempt_budget_exhausted: 'Puedes explorar nuestros servicios o solicitar que te contactemos.',
  daily_limit: 'Por hoy puedes continuar desde los enlaces o solicitar contacto.',
  daily_conversation_limit: 'Por hoy puedes continuar desde los enlaces o solicitar contacto.',
  global_budget_exhausted: 'La orientación por mensajes no está disponible ahora. Los enlaces y el contacto siguen disponibles.',
  capture_active: 'La solicitud de contacto está abierta. Puedes completarla o cancelarla para continuar.',
  cooldown: 'Podrás iniciar otra conversación después de la pausa indicada.',
  pending: 'Hay una consulta en curso. Consulta su estado antes de enviar otra.',
  uncertain: 'No pudimos confirmar esa respuesta. Puedes consultar su estado o continuar desde los enlaces.',
  failed: 'La consulta no pudo completarse. Puedes reintentar de forma explícita.',
  provider_failed: 'La consulta no pudo completarse. Puedes reintentar de forma explícita.',
  request_conflict: 'Esta consulta cambió. Recupera el estado de la conversación antes de continuar.',
  conversation_changed: 'La conversación cambió en otra pestaña. Recupera su estado para continuar.',
}

export function useChatbot(api = chatbotApi) {
  const [messages, setMessages] = useState([welcome])
  const [session, setSession] = useState(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [recovered, setRecovered] = useState(false)
  const current = useRef(null)
  const retry = useRef(null)
  const delivered = useRef(new Set())
  const remote = useDelayedOperation()

  function accept(value, { restore = false, requestId } = {}) {
    if (!value?.state) return
    const changed = current.current && current.current.state.conversation_id !== value.state.conversation_id
    current.current = value
    setSession(value)
    if (changed) { setMessages([welcome]); setDraft(''); setRecovered(false); retry.current = null; delivered.current.clear() }
    const result = value.result || (restore ? value.state.last_result : null)
    const responseId = result?.request_id || requestId || `restored:${value.state.completed_rounds}:${result?.reply}`
    if (result?.reply && !delivered.current.has(responseId)) {
      setMessages((previous) => [...(changed ? [welcome] : previous), { role: 'assistant', content: result.reply,
        requestId: result.request_id || requestId, conversationId: value.state.conversation_id }])
      if (restore) setRecovered(true)
      delivered.current.add(responseId)
      if (retry.current?.payload.request_id === result.request_id) { retry.current = null; setDraft('') }
    }
    if (value.status !== 'ready' && value.status !== 'completed') setError(notices[value.status] || 'No pudimos completar la consulta. Puedes recuperar su estado.')
  }

  function settle(outcome, options) {
    if (outcome.error) {
      if (outcome.error.result?.state) accept(outcome.error.result)
      setError(notices[outcome.error.message] || 'No pudimos confirmar la respuesta. Puedes consultar su estado o explorar nuestros servicios.')
      if (outcome.error.message === 'provider_failed') retry.current = { ...retry.current, fresh: true }
      return
    }
    accept(outcome.value, options)
    if (outcome.value.status === 'completed') { retry.current = null; setDraft('') }
    else if (outcome.value.status === 'failed') retry.current = { ...retry.current, fresh: true }
  }

  function loadSession({ restoreMessages = true } = {}) {
    return remote.run((signal) => api.session({ signal }), (outcome) => {
      setError('')
      settle(outcome, { restore: restoreMessages })
    })
  }

  function send(text = draft, retrying = false) {
    const content = text.trim()
    const state = current.current?.state
    if (!state || !content || content.length > 1000 || (!retrying && (!state.can_send || !current.current.provider_enabled))) return false
    const previousRetry = retry.current
    if (retrying && previousRetry?.fresh && (!state.can_send || !current.current.provider_enabled)) return false
    const payload = retrying && previousRetry
      ? { ...previousRetry.payload, request_id: previousRetry.fresh ? crypto.randomUUID() : previousRetry.payload.request_id }
      : { conversation_id: state.conversation_id, request_id: crypto.randomUUID(),
          messages: [...messages, { role: 'user', content }].slice(-12).map(({ role, content: message }) => ({ role, content: message })) }
    const accepted = remote.run((signal) => api.send(payload, { signal }), (outcome) => settle(outcome, { requestId: payload.request_id }))
    if (!accepted) return false
    retry.current = { payload, fresh: false }
    setError('')
    setDraft(content)
    if (!retrying) setMessages((previous) => [...previous, { role: 'user', content }])
    return true
  }

  function command(operation) {
    const state = current.current?.state
    if (!state) return false
    return remote.run((signal) => api.command(operation, state.conversation_id, { signal }), (outcome) => {
      setError('')
      settle(outcome)
    })
  }

  return { messages, session, draft, setDraft, error, recovered, pending: remote.pending,
    loadSession, send, command, retry: () => send(retry.current?.payload.messages.at(-1).content || draft, true),
    canRetry: Boolean(retry.current && (!retry.current.fresh || session?.state.can_send)), retryIsFresh: Boolean(retry.current?.fresh) }
}
