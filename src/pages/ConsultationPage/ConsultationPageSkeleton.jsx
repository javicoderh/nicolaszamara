import './ConsultationPageSkeleton.css'

export default function ConsultationPageSkeleton() {
  return (
    <main id="main-content" className="consult-skeleton" aria-label="Cargando consulta" aria-busy="true">
      <div className="consult-skeleton__intro" aria-hidden="true">
        <span className="consult-skeleton__photo" />
        <span className="consult-skeleton__title" />
      </div>
      <div className="consult-skeleton__content" aria-hidden="true"><i /><i /><i /></div>
    </main>
  )
}
