import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChatbotProvider, useChatbotContext } from '../../contexts/ChatbotContext/ChatbotContext.jsx'
import { useChatbotViewport } from '../../hooks/useChatbotViewport/useChatbotViewport.js'
import { useChatbotModal } from '../../hooks/useChatbotModal/useChatbotModal.js'
import { MODAL_FADE_MS, useModalPresence } from '../../hooks/useModalPresence/useModalPresence.js'
import { siteSettings } from '../../content/siteContent.js'
import { trackHotmartClick } from '../../services/hotmartTrackingService.js'
import ChatContactForm from '../ChatContactForm/ChatContactForm.jsx'
import ChatReplySkeleton from '../ChatReply/ChatReplySkeleton.jsx'
import './Chatbot.css'

const quickPrompts = ['Quiero conocer las terapias', 'Busco información sobre cursos', 'Quiero consultar disponibilidad']
const serviceLinks = [
  { href: '/consulta', label: 'Consulta' }, { href: '/terapias', label: 'Terapias' },
  { href: '/cursos', label: 'Cursos' }, { href: '/#interes-naturaleza', label: 'Naturaleza' },
  { href: '/cursos#interes-online', label: 'Curso online' },
]

export default function Chatbot({ api, ...props }) {
  const shared = useChatbotContext()
  return shared ? <ChatbotView {...props} {...shared} />
    : <ChatbotProvider api={api}><Chatbot {...props} /></ChatbotProvider>
}

function ChatbotView({ submitContact, embedded = false, hidden = false, chat, open, setOpen, contactSaved, setContactSaved, ensureSession }) {
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const shellRef = useRef(null)
  const panelRef = useRef(null)
  const launcherRef = useRef(null)
  const motion = useModalPresence(open, !hidden && !embedded)
  const visible = !hidden && (embedded || motion.present)
  const state = chat.session?.state
  const canSend = state?.can_send && chat.session?.provider_enabled && !chat.pending
  const action = state?.action

  useEffect(() => { if (embedded && !hidden) ensureSession() }, [embedded, hidden])
  useChatbotViewport(shellRef, motion.present)
  useChatbotModal({ active: motion.present, panelRef, shellRef, launcherRef, onClose: () => setOpen(false) })

  useEffect(() => { if (visible && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, [chat.messages, chat.pending, visible])

  function minimize() {
    setOpen(false)
  }

  function toggle() {
    if (open) { minimize(); return }
    ensureSession()
    setOpen(true)
  }

  if (hidden) return null
  const view = <div ref={shellRef} style={{ '--chat-modal-duration': `${MODAL_FADE_MS}ms` }} className={`chatbot${embedded ? ' chatbot--embedded' : ''}${motion.present ? ' chatbot--open' : ''}${motion.exiting ? ' chatbot--closing' : ''}`}>
    {motion.present && <div className="chatbot__backdrop" aria-hidden="true" onClick={minimize} />}
    {(embedded || motion.present || chat.session || chat.pending || chat.error) && <section ref={panelRef} id={embedded ? 'chatbot-page-panel' : 'chatbot-panel'} hidden={!visible}
      className={`chatbot__panel${state?.capturing ? ' chatbot__panel--capturing' : ''}`} aria-label="Asistente de servicios" role={embedded ? 'region' : 'dialog'} aria-modal={motion.present ? true : undefined} tabIndex={-1}
      onAnimationEnd={motion.finishExit}>
      {!embedded && <header className="chatbot__header">
        <span className="chatbot__emblem" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M16 3 27 9v14l-11 6-11-6V9Z" /><path d="M10 19c0-8 12-9 12-9s0 12-8 12m-4 2 10-12" /></svg></span>
        <div className="chatbot__identity"><span className="chatbot__eyebrow">Nicolás Zamara</span><strong>Conversemos</strong><span className="chatbot__subtitle">Nuestro asistente virtual</span></div>
        <div className="chatbot__window-actions">
          <a href="/chatbot" aria-label="Ampliar conversación" title="Ampliar conversación"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M14 5h5v5m0-5-6 6M10 19H5v-5m0 5 6-6" /></svg></a>
          <button className="chatbot__close" type="button" aria-label="Cerrar asistente" title="Cerrar" onClick={minimize}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg></button>
        </div>
      </header>}
      {!embedded && chat.messages.length === 1 && <div className="chatbot__intro"><span className="chatbot__intro-mark" aria-hidden="true">✧</span><h2>¿En qué podemos<br /> ayudarte?</h2><p>Escríbenos o explora nuestros servicios.</p></div>}
      <div className={`chatbot__messages${embedded && chat.messages.length === 1 && !chat.pending && !chat.error ? ' chatbot__messages--empty' : ''}`} ref={listRef} role="log" aria-label="Conversación" aria-live="polite" aria-relevant="additions text">
        {chat.messages.map((message, index) => index === 0 ? null : <div className={`chatbot__turn chatbot__turn--${message.role}`} key={`${index}-${message.role}`}>
          <p className={`chatbot__message chatbot__message--${message.role}`}>{message.content}</p>
          {message.role === 'assistant' && message.action === 'show_hotmart' && <a className="chatbot__enrollment" href={siteSettings.courseUrl}
            target="_blank" rel="noopener noreferrer" aria-label="Inscribirme al curso en Hotmart (abre en otra pestaña)"
            onClick={() => { void trackHotmartClick('chatbot') }}>Inscribirme en Hotmart ↗</a>}
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
            <button type="submit" aria-label="Enviar" disabled={!canSend || !chat.draft.trim()}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5m-6 6 6-6 6 6" /></svg></button>
            {!canSend && <p id="chatbot-send-status" className="chatbot__send-status" role="status">
              {chat.pending ? 'Conectando con el asistente… Espera un momento para enviar.'
                : !chat.session ? 'No se pudo conectar con el asistente. Tu mensaje no se ha enviado. Usa «Recuperar estado» para reintentar.'
                  : 'El envío no está disponible en este momento. Puedes recuperar el estado o explorar los servicios.'}
            </p>}
          </form>}
        </>}
      <nav className="chatbot__links" aria-label="Explorar servicios">
        {serviceLinks.map((link) => <a href={link.href} key={link.href} onClick={(event) => { if (!embedded && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) minimize() }}>{link.label}</a>)}
        {!['medical_boundary', 'urgent_attention'].includes(state?.last_result?.response_key) && <a href={siteSettings.courseUrl} target="_blank" rel="noopener noreferrer" aria-label="Ver el curso e inscribirme (abre en otra pestaña)" onClick={() => { void trackHotmartClick('chatbot') }}>Inscribirme ↗</a>}
        {state && !state.capturing && <button type="button" aria-label="Solicitar que me contacten" disabled={chat.pending || state.busy} onClick={() => { setContactSaved(false); chat.command('start_capture') }}>Contacto</button>}
        {action === 'show_privacy' && <a href="/privacidad">Información de privacidad</a>}
      </nav>
      {!chat.pending && (chat.error || chat.canRetry || state?.closed || chat.recovered) && <div className="chatbot__prompts">
        {chat.canRetry && <button type="button" onClick={chat.retry}>{chat.retryIsFresh ? 'Reintentar consulta' : 'Consultar estado de mi mensaje'}</button>}
        <button type="button" onClick={chat.loadSession}>Recuperar estado</button>
        {state?.closed && <>
          {state.restart_at && <p className="chatbot__notice">Puedes intentar una nueva conversación desde {new Date(state.restart_at).toLocaleString('es-CL')}.</p>}
          <button type="button" onClick={() => chat.command('restart')}>Iniciar otra conversación</button>
        </>}
      </div>}
      <p className="chatbot__notice">El mensaje se envía a OpenAI. No incluyas datos personales sensibles ni información clínica. Los datos del formulario de contacto se envían por separado. <a href="/privacidad">Privacidad</a></p>
    </section>}
    {!embedded && <button ref={launcherRef} hidden={motion.present} className="chatbot__launcher" type="button" aria-label="Abrir asistente: ¿en qué podemos ayudarte?" aria-expanded={open} aria-controls={open || chat.session ? 'chatbot-panel' : undefined} onClick={toggle}>
      {!open && <span className="chatbot__invitation"><span>Conversemos</span>¿En qué podemos ayudarte?</span>}
      <span className="chatbot__launcher-orb" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{open ? <path d="m10 13 6 6 6-6" /> : <><path d="M7 7h18v14H15l-6 5v-5H7Z" /><path d="M12 12h8m-8 4h5" /></>}</svg><span className="chatbot__signal" /></span>
    </button>}
  </div>
  return embedded ? view : createPortal(view, document.body)
}
