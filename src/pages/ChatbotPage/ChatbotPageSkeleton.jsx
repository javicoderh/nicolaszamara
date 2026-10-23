import './ChatbotPageSkeleton.css'

export default function ChatbotPageSkeleton() {
  return <main id="main-content" className="chatbot-page-skeleton page-wrap" aria-busy="true" aria-label="Cargando conversación">
    <div aria-hidden="true"><span /><span /></div>
    <div className="chatbot-page-skeleton__composer" aria-hidden="true"><span /><span /></div>
  </main>
}
