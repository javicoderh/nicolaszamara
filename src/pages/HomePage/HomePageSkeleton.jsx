import AreaGridSkeleton from '../../components/AreaGrid/AreaGridSkeleton.jsx'
import PhotoPlaceholderSkeleton from '../../components/PhotoPlaceholder/PhotoPlaceholderSkeleton.jsx'
import './HomePageSkeleton.css'

export default function HomePageSkeleton() {
  return (
    <main id="main-content" className="home-page-skeleton" aria-label="Cargando inicio" aria-busy="true">
      <div className="home-page-skeleton__hero page-wrap">
        <div className="home-page-skeleton__copy">
          <span className="home-page-skeleton__eyebrow" />
          <span className="home-page-skeleton__title" />
          <span className="home-page-skeleton__text" />
          <span className="home-page-skeleton__action" />
        </div>
        <PhotoPlaceholderSkeleton orientation="portrait" />
      </div>
      <div className="home-page-skeleton__areas"><div className="page-wrap"><AreaGridSkeleton /></div></div>
      <div className="home-page-skeleton__band" />
      <div className="home-page-skeleton__section page-wrap"><span /><span /></div>
      <div className="home-page-skeleton__about page-wrap"><span /></div>
      <div className="home-page-skeleton__nature"><span /><span /></div>
      <div className="home-page-skeleton__form page-wrap"><span /></div>
    </main>
  )
}
