import './AdminDashboardSkeleton.css'
export default function AdminDashboardSkeleton() {
  return <div className="admin-dashboard-skeleton" role="status" aria-label="Cargando intereses" aria-busy="true"><div>{Array.from({ length: 6 }, (_, index) => <span key={index} />)}</div><section>{Array.from({ length: 6 }, (_, index) => <span key={index} />)}</section></div>
}
