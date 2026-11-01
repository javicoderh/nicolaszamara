import './AdminInterestModalSkeleton.css'
export default function AdminInterestModalSkeleton({ compact = false, label = 'Cargando detalle' }) {
  return <div className={`admin-interest-modal-skeleton${compact ? ' admin-interest-modal-skeleton--compact' : ''}`} role="status" aria-label={label} aria-busy="true">{Array.from({ length: compact ? 2 : 8 }, (_, index) => <span key={index} />)}</div>
}
