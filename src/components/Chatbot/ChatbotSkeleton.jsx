import './ChatbotSkeleton.css'
import FloatingWhatsAppSkeleton from '../FloatingWhatsApp/FloatingWhatsAppSkeleton.jsx'

export default function ChatbotSkeleton() {
  return <div className="chatbot-skeleton" aria-hidden="true"><FloatingWhatsAppSkeleton /><span /></div>
}
