import { trackEvent } from '../../services/analyticsService.js'
import './FloatingWhatsApp.css'
import { ctaAttributes } from '../../services/analyticsSensors.js'

const measurement = { element_id: 'floating_whatsapp', placement: 'floating_contact', service: 'general' }

export default function FloatingWhatsApp({ phoneNumber }) {
  const number = phoneNumber?.replace(/\D/g, '')
  if (!number) return null
  return (
    <a className="floating-whatsapp" href={`https://wa.me/${number}`} target="_blank" rel="noopener noreferrer"
      {...ctaAttributes(measurement)} aria-label="Contactar por WhatsApp (abre en otra pestaña)" title="Escríbenos por WhatsApp" onClick={() => trackEvent('whatsapp_click', measurement)}>
      <svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
        <path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.6a10.6 10.6 0 0 1-5.4-1.5l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6Z" />
        <path d="M12.3 9.4c-.3-.6-.6-.6-.9-.6h-.8c-.3 0-.7.1-1 .5-.4.4-1.4 1.4-1.4 3.3s1.4 3.7 1.6 4c.2.3 2.8 4.3 6.8 6 .9.4 1.7.6 2.3.7 1 .3 1.9.2 2.6.1.8-.1 2.4-1 2.8-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5l-2.8-1.3c-.4-.2-.7-.3-1 .2l-1.3 1.5c-.2.3-.5.3-.9.1-.4-.2-1.7-.6-3.2-2-.1-.1-1.6-1.5-1.9-2.2-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.2.1-.5 0-.7l-1.5-3.1Z" />
      </svg>
    </a>
  )
}
