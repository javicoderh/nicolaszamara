import { useEffect } from 'react'
import { HydrationProvider, useHydrated } from '../contexts/HydrationContext/HydrationContext.jsx'
import { AnalyticsConsentProvider, useAnalyticsConsent } from '../contexts/AnalyticsConsentContext/AnalyticsConsentContext.jsx'
import AnalyticsConsent from '../components/AnalyticsConsent/AnalyticsConsent.jsx'
import AnalyticsConsentSkeleton from '../components/AnalyticsConsent/AnalyticsConsentSkeleton.jsx'
import { createPortal } from 'react-dom'
import { SiteContentProvider, useSiteContent } from '../contexts/SiteContentContext/SiteContentContext.jsx'
import { ChatbotProvider } from '../contexts/ChatbotContext/ChatbotContext.jsx'
import { useSiteNavigation } from '../hooks/useSiteNavigation/useSiteNavigation.js'
import { SITE_ROUTES, normalizeSitePath } from '../config/siteRoutes.js'
import { applySeoMetadata } from '../services/seoService.js'
import { usePageDelay } from '../hooks/usePageDelay/usePageDelay.js'
import { usePageAnalytics } from '../hooks/usePageAnalytics/usePageAnalytics.js'
import { usePageSensors } from '../hooks/usePageSensors/usePageSensors.js'
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
import AboutPage from '../pages/AboutPage/AboutPage.jsx'
import AboutPageSkeleton from '../pages/AboutPage/AboutPageSkeleton.jsx'
import NaturePage from '../pages/NaturePage/NaturePage.jsx'
import NaturePageSkeleton from '../pages/NaturePage/NaturePageSkeleton.jsx'
import ChatbotPage from '../pages/ChatbotPage/ChatbotPage.jsx'
import ChatbotPageSkeleton from '../pages/ChatbotPage/ChatbotPageSkeleton.jsx'
import AdminPage from '../pages/AdminPage/AdminPage.jsx'
import BlogPage from '../pages/BlogPage/BlogPage.jsx'
import BlogPageSkeleton from '../pages/BlogPage/BlogPageSkeleton.jsx'

const routes = {
  '/blog': { Page: BlogPage, Skeleton: BlogPageSkeleton },
  '/sobre-mi': { Page: AboutPage, Skeleton: AboutPageSkeleton },
  '/naturaleza': { Page: NaturePage, Skeleton: NaturePageSkeleton },
  '/chatbot': { Page: ChatbotPage, Skeleton: ChatbotPageSkeleton },
  '/': { Page: HomePage, Skeleton: HomePageSkeleton },
  '/consulta': { Page: ConsultationPage, Skeleton: ConsultationPageSkeleton },
  '/terapias': { Page: TherapiesPage, Skeleton: TherapiesPageSkeleton },
  '/cursos': { Page: CoursesPage, Skeleton: CoursesPageSkeleton },
  '/privacidad': { Page: PrivacyPage, Skeleton: PrivacyPageSkeleton },
}
const routePaths = SITE_ROUTES.map(({ path }) => path)

export function normalizePath(pathname) { return normalizeSitePath(pathname) }

function updateMetadata(path) {
  const enabled = document.querySelector('meta[name="site-indexing-enabled"]')?.content === 'true'
    && ['www.nicolaszamara.com', 'nicolaszamara.com'].includes(window.location.hostname)
  applySeoMetadata(document, path, enabled)
}

function AppContent({ location, initialBlog }) {
  const hydrated = useHydrated()
  const preferences = useAnalyticsConsent()
  const content = useSiteContent()
  const path = normalizePath(location.pathname)
  const isBlog = path === '/blog' || /^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)
  const route = (isBlog ? routes['/blog'] : routes[path]) || { Page: NotFoundPage, Skeleton: NotFoundPageSkeleton }
  const ready = usePageDelay(isBlog ? '/blog' : path)
  const assistantReady = usePageDelay('global-assistant')
  usePageAnalytics(path, ready)
  usePageSensors(path, ready)

  useEffect(() => {
    if (!ready || isBlog) return
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
      <div className="site-app__loading-shell" data-hydrated={hydrated ? 'true' : undefined} data-ready={ready ? 'true' : undefined}>
        {!ready && <div className="site-app__loading-skeleton"><SiteHeaderSkeleton /><Skeleton /><SiteFooterSkeleton /></div>}
        <div className="site-app__page-content" aria-hidden={hydrated && !ready ? true : undefined}>
          <SiteHeader currentPath={path} />
          <Page location={location} initialBlog={initialBlog} />
          <SiteFooter onOpenAnalytics={preferences.openPreferences} />
        </div>
      </div>
      {preferences.visible && (assistantReady
        ? <AnalyticsConsent key={preferences.consent.updatedAt || 'initial'} consent={preferences.consent} onSave={preferences.savePreferences} onClose={preferences.closePreferences} />
        : <AnalyticsConsentSkeleton />)}
      {assistantReady ? <Chatbot hidden={path === '/chatbot' || Boolean(location.state?.blogBackground)} /> : path !== '/chatbot' && (hydrated ? createPortal(<ChatbotSkeleton />, document.body) : <ChatbotSkeleton />)}
    </div>
  )
}

function AppRoutes({ initialPath, initialBlog }) {
  const location = useSiteNavigation(routePaths, initialPath, initialBlog?.search || '')
  const path = normalizePath(location.pathname)
  useEffect(() => { if (!path.startsWith('/blog/')) updateMetadata(path) }, [path])
  // A separate branch unmounts public sensors, consent UI and the assistant.
  return path === '/admin' ? <AdminPage /> : <AppContent location={location} initialBlog={initialBlog} />
}

export default function App({ initialPath = '/', initialBlog = null }) {
  return <HydrationProvider><SiteContentProvider><AnalyticsConsentProvider><ChatbotProvider><AppRoutes initialPath={initialPath} initialBlog={initialBlog} /></ChatbotProvider></AnalyticsConsentProvider></SiteContentProvider></HydrationProvider>
}
