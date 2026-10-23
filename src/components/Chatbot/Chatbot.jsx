import { useEffect, useRef, useState } from 'react'
import { useChatbot } from '../../hooks/useChatbot/useChatbot.js'
import { siteSettings } from '../../content/siteContent.js'
import { trackHotmartClick } from '../../services/hotmartTrackingService.js'
import ChatContactForm from '../ChatContactForm/ChatContactForm.jsx'
import ChatReplySkeleton from '../ChatReply/ChatReplySkeleton.jsx'
import ChatFeedback from '../ChatFeedback/ChatFeedback.jsx'
import './Chatbot.css'

const quickPrompts = ['Quiero conocer las terapias', 'Busco información sobre cursos', 'Quiero consultar disponibilidad']
const serviceLinks = [
  { href: '/consulta', label: 'Consulta' }, { href: '/terapias', label: 'Terapias' },
  { href: '/cursos', label: 'Cursos' }, { href: '/#interes-naturaleza', label: 'Naturaleza' },
  { href: '/cursos#interes-online', label: 'Curso online' },
]

export default function Chatbot({ api, submitContact, embedded = false }) {
  const [open, setOpen] = useState(embedded)
  const [contactSaved, setContactSaved] = useState(false)
  const chat = useChatbot(api)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const state = chat.session?.state
  const canSend = state?.can_send && chat.session?.provider_enabled && !chat.pending
  const action = state?.action

  useEffect(() => { if (embedded) chat.loadSession({ restoreMessages: false }) }, [embedded])

  useEffect(() => { if (open && !chat.pending) inputRef.current?.focus({ preventScroll: embedded }) }, [open, chat.pending, embedded])
  useEffect(() => { if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, [chat.messages, chat.pending, open])

  function toggle() {
    if (!open) chat.loadSession()
    setOpen((previous) => !previous)
  }

  return <div className={`chatbot${embedded ? ' chatbot--embedded' : ''}`}>
    {open && <section id="chatbot-panel" className="chatbot__panel" aria-label="Asistente de servicios">
      {!embedded && <header className="chatbot__header"><div><strong>¿En qué podemos ayudarte?</strong><span>Asistente de servicios</span></div>
        <button className="chatbot__close" type="button" aria-label="Cerrar asistente" onClick={() => setOpen(false)}>×</button>
      </header>}
      <div className={`chatbot__messages${embedded && chat.messages.length === 1 && !chat.pending && !chat.error ? ' chatbot__messages--empty' : ''}`} ref={listRef} role="log" aria-label="Conversación" aria-live="polite" aria-relevant="additions text">
        {chat.messages.map((message, index) => embedded && index === 0 ? null : <div className={`chatbot__turn chatbot__turn--${message.role}`} key={`${index}-${message.role}`}>
          <p className={`chatbot__message chatbot__message--${message.role}`}>{message.content}</p>
          {embedded && message.role === 'assistant' && message.requestId && <ChatFeedback requestId={message.requestId} conversationId={message.conversationId} />}
        </div>)}
        {chat.recovered && <p className="chatbot__notice">Recuperamos la última orientación y el estado de tu conversación. El historial anterior de esta pestaña puede no estar disponible.</p>}
        {chat.pending && <ChatReplySkeleton />}
        {chat.error && <p className="chatbot__error" role="alert">{chat.error}</p>}
        {!chat.pending && state?.closed && <p className="chatbot__message chatbot__message--assistant">Podemos seguir en contacto a través del formulario. También puedes explorar nuestros servicios.</p>}
        {!chat.pending && chat.session && !chat.session.provider_enabled && <p className="chatbot__notice">La orientación por mensajes no está disponible ahora. Puedes explorar los servicios o solicitar contacto.</p>}
        {contactSaved && !state?.capturing && <p role="status">Recibimos tu solicitud. Te contactaremos por el canal que elegiste.</p>}
      </div>
      {state?.capturing ? <ChatContactForm key={state.conversation_id} conversationId={state.conversation_id} initialTopic={state.topic}
        submitContact={submitContact} onCancel={() => chat.command('cancel_capture')} onSaved={() => { setContactSaved(true); chat.loadSession() }} />
        : <>
          {!embedded && chat.messages.length === 1 && canSend && <div className="chatbot__prompts" aria-label="Temas sugeridos">
            {quickPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => chat.send(prompt)}>{prompt}</button>)}
          </div>}
          {!state?.closed && <form className="chatbot__form" onSubmit={(event) => { event.preventDefault(); chat.send() }}>
            <label className="chatbot__input-label" htmlFor="chatbot-message">Escribe tu consulta</label>
            <textarea id="chatbot-message" ref={inputRef} value={chat.draft} maxLength={1000} rows={2} disabled={chat.pending && Boolean(state)}
              aria-describedby={!canSend ? 'chatbot-send-status' : undefined}
              onChange={(event) => chat.setDraft(event.target.value)} placeholder="Escríbenos lo que tienes en mente…" />
            <button type="submit" aria-label="Enviar" disabled={!canSend || !chat.draft.trim()}>{embedded ? <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5m-6 6 6-6 6 6" /></svg> : 'Enviar'}</button>
            {!canSend && <p id="chatbot-send-status" className="chatbot__send-status" role="status">
              {chat.pending ? 'Conectando con el asistente… Espera un momento para enviar.'
                : !chat.session ? 'No se pudo conectar con el asistente. Tu mensaje no se ha enviado. Usa «Recuperar estado» para reintentar.'
                  : 'El envío no está disponible en este momento. Puedes recuperar el estado o explorar los servicios.'}
            </p>}
          </form>}
        </>}
      <nav className="chatbot__links" aria-label="Explorar servicios">
        {serviceLinks.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}
        {!['medical_boundary', 'urgent_attention'].includes(state?.last_result?.response_key) && <a href={siteSettings.courseUrl} target="_blank" rel="noopener noreferrer" aria-label="Ver el curso e inscribirme (abre en otra pestaña)" onClick={() => { void trackHotmartClick('chatbot') }}>Inscribirme ↗</a>}
        {state && !state.capturing && <button type="button" aria-label="Solicitar que me contacten" disabled={chat.pending || state.busy} onClick={() => { setContactSaved(false); chat.command('start_capture') }}>Contacto</button>}
        {action === 'show_privacy' && <a href="/privacidad">Información de privacidad</a>}
      </nav>
      {!chat.pending && (!embedded || chat.error || chat.canRetry || state?.closed || chat.recovered) && <div className="chatbot__prompts">
        {chat.canRetry && <button type="button" onClick={chat.retry}>{chat.retryIsFresh ? 'Reintentar consulta' : 'Consultar estado de mi mensaje'}</button>}
        <button type="button" onClick={chat.loadSession}>Recuperar estado</button>
        {state?.closed && <>
          {state.restart_at && <p className="chatbot__notice">Puedes intentar una nueva conversación desde {new Date(state.restart_at).toLocaleString('es-CL')}.</p>}
          <button type="button" onClick={() => chat.command('restart')}>Iniciar otra conversación</button>
        </>}
      </div>}
      <p className="chatbot__notice">El mensaje se envía a OpenAI. No incluyas datos personales sensibles ni información clínica. Los datos del formulario de contacto se envían por separado. <a href="/privacidad">Privacidad</a></p>
    </section>}
    {!embedded && <button className="chatbot__launcher" type="button" aria-expanded={open} aria-controls="chatbot-panel" onClick={toggle}>{open ? 'Cerrar' : '¿Te ayudamos a elegir un servicio?'}</button>}
  </div>
}
