import './ChatContactFormSkeleton.css'
import ContactPreferenceSkeleton from '../ContactPreference/ContactPreferenceSkeleton.jsx'

export default function ChatContactFormSkeleton() {
  return <div className="chat-contact-skeleton" role="status" aria-label="Guardando solicitud de contacto" aria-busy="true"><span /><ContactPreferenceSkeleton /><span /><span /></div>
}
