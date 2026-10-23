import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { SiteContentProvider, useSiteContent } from '../contexts/SiteContentContext/SiteContentContext.jsx'
import { ChatbotProvider } from '../contexts/ChatbotContext/ChatbotContext.jsx'
import { useSiteNavigation } from '../hooks/useSiteNavigation/useSiteNavigation.js'
import { pageMetadata } from '../content/siteContent.js'
import { usePageDelay } from '../hooks/usePageDelay/usePageDelay.js'
import SiteHeader from '../components/SiteHeader/SiteHeader.jsx'
import SiteHeaderSkeleton from '../components/SiteHeader/SiteHeaderSkeleton.jsx'
import SiteFooter from '../components/SiteFooter/SiteFooter.jsx'
import SiteFooterSkeleton from '../components/SiteFooter/SiteFooterSkeleton.jsx'
import HomePage from '../pages/HomePage/HomePage.jsx'
import HomePageSkeleton from '../pages/HomePage/HomePageSkeleton.jsx'
import TherapiesPage from '../pages/TherapiesPage/TherapiesPage.jsx'
import TherapiesPageSkeleton from '../pages/TherapiesPage/TherapiesPageSkeleton.jsx'
import ConsultationPage from '../pages/ConsultationPage/ConsultationPage.jsx'
import ConsultationPageSkeleton from '../pages/ConsultationPage/ConsultationPageSkeleton.jsx'
import CoursesPage from '../pages/CoursesPage/CoursesPage.jsx'
import CoursesPageSkeleton from '../pages/CoursesPage/CoursesPageSkeleton.jsx'
import PrivacyPage from '../pages/PrivacyPage/PrivacyPage.jsx'
import PrivacyPageSkeleton from '../pages/PrivacyPage/PrivacyPageSkeleton.jsx'
import NotFoundPage from '../pages/NotFoundPage/NotFoundPage.jsx'
import NotFoundPageSkeleton from '../pages/NotFoundPage/NotFoundPageSkeleton.jsx'
import Chatbot from '../components/Chatbot/Chatbot.jsx'
import ChatbotSkeleton from '../components/Chatbot/ChatbotSkeleton.jsx'
import './App.css'
import ChatbotPage from '../pages/ChatbotPage/ChatbotPage.jsx'
import ChatbotPageSkeleton from '../pages/ChatbotPage/ChatbotPageSkeleton.jsx'

const routes = {
  '/chatbot': { Page: ChatbotPage, Skeleton: ChatbotPageSkeleton },
  '/': { Page: HomePage, Skeleton: HomePageSkeleton },
  '/consulta': { Page: ConsultationPage, Skeleton: ConsultationPageSkeleton },
  '/terapias': { Page: TherapiesPage, Skeleton: TherapiesPageSkeleton },
  '/cursos': { Page: CoursesPage, Skeleton: CoursesPageSkeleton },
  '/privacidad': { Page: PrivacyPage, Skeleton: PrivacyPageSkeleton },
}
const routePaths = Object.keys(routes)

export function normalizePath(pathname) {
  if (pathname.length > 1) return pathname.replace(/\/+$/, '') || '/'
  return pathname
}

function updateMetadata(path) {
  const metadata = pageMetadata[path]
  if (!metadata) {
    document.title = 'Página no encontrada | Nicolás Zamara'
    return
  }
  document.title = metadata.title
  const description = document.querySelector('meta[name="description"]')
  if (description) description.setAttribute('content', metadata.description)
  const socialTitle = document.querySelector('meta[property="og:title"]')
  if (socialTitle) socialTitle.setAttribute('content', metadata.title)
  const socialDescription = document.querySelector('meta[property="og:description"]')
  if (socialDescription) socialDescription.setAttribute('content', metadata.description)
  const productionHosts = ['www.nicolaszamara.com', 'nicolaszamara.com']
  const robots = document.querySelector('meta[name="robots"]')
  if (robots) robots.setAttribute('content', productionHosts.includes(window.location.hostname) ? 'index,follow' : 'noindex,nofollow')
}

function AppContent() {
  const content = useSiteContent()
  const location = useSiteNavigation(routePaths)
  const path = normalizePath(location.pathname)
  const route = routes[path] || { Page: NotFoundPage, Skeleton: NotFoundPageSkeleton }
  const ready = usePageDelay(path)
  const assistantReady = usePageDelay('global-assistant')

  useEffect(() => {
    updateMetadata(path)
    if (!ready) return
    const frame = window.requestAnimationFrame(() => {
      if (!location.hash) { window.scrollTo({ top: 0, behavior: 'instant' }); return }
      try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView() } catch { /* Invalid URL escape: keep the page usable. */ }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [path, location.hash, ready])

  const { Page, Skeleton } = route
  return (
    <div className="site-app" data-brand={content.brand}>
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      {ready ? <SiteHeader /> : <SiteHeaderSkeleton />}
      {ready ? <Page /> : <Skeleton />}
      {ready ? <SiteFooter /> : <SiteFooterSkeleton />}
      {assistantReady ? <Chatbot hidden={path === '/chatbot'} /> : path !== '/chatbot' && createPortal(<ChatbotSkeleton />, document.body)}
    </div>
  )
}

export default function App() {
  return <SiteContentProvider><ChatbotProvider><AppContent /></ChatbotProvider></SiteContentProvider>
}
