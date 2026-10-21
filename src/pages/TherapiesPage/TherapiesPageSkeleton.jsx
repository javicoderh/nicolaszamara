import TherapyCardSkeleton from '../../components/TherapyCard/TherapyCardSkeleton.jsx'
import './TherapiesPageSkeleton.css'

export default function TherapiesPageSkeleton() {
  return (
    <main id="main-content" className="therapies-page-skeleton" aria-label="Cargando terapias" aria-busy="true">
      <div className="therapies-page-skeleton__intro"><span /><span /><span /></div>
      <div className="therapies-page-skeleton__grid">
        {Array.from({ length: 8 }, (_, index) => <TherapyCardSkeleton key={index} />)}
      </div>
    </main>
  )
}
