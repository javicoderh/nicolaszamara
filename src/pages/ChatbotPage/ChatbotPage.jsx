import Chatbot from '../../components/Chatbot/Chatbot.jsx'
import './ChatbotPage.css'

export default function ChatbotPage({ api, submitContact }) {
  return <main id="main-content" className="chatbot-page page-wrap">
    <h1>¿En qué podemos ayudarte?</h1>
    <p className="chatbot-page__hint">Escríbenos tu consulta o elige una opción para conocer nuestros servicios.</p>
    <Chatbot embedded api={api} submitContact={submitContact} />
  </main>
}
