import InterestFormSkeleton from '../../components/InterestForm/InterestFormSkeleton.jsx'
import './NaturePageSkeleton.css'

export default function NaturePageSkeleton() {
  return <main className="nature-skeleton" aria-label="Cargando naturaleza" aria-busy="true"><div className="nature-skeleton__hero" aria-hidden="true"><span /><span /></div><div className="nature-skeleton__experience page-wrap" aria-hidden="true"><span /><span /><span /></div><div className="nature-skeleton__form page-wrap"><InterestFormSkeleton /></div></main>
}
