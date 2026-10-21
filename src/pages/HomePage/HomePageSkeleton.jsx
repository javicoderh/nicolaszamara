import SiteHeaderSkeleton from '../../components/SiteHeader/SiteHeaderSkeleton.jsx'
import SiteFooterSkeleton from '../../components/SiteFooter/SiteFooterSkeleton.jsx'
import './HomePageSkeleton.css'

export default function HomePageSkeleton() {
  return (
    <div className="home-page-skeleton" aria-label="Cargando inicio" aria-busy="true">
      <SiteHeaderSkeleton />
      <main id="main-content" className="home-page-skeleton__main">
        <span className="home-page-skeleton__eyebrow" />
        <span className="home-page-skeleton__title" />
        <span className="home-page-skeleton__copy" />
        <span className="home-page-skeleton__action" />
        <div className="home-page-skeleton__cards"><span /><span /><span /></div>
      </main>
      <SiteFooterSkeleton />
    </div>
  )
}
