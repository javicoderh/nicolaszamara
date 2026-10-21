import './SiteHeaderSkeleton.css'
import BrandMarkSkeleton from '../BrandMark/BrandMarkSkeleton.jsx'

export default function SiteHeaderSkeleton() {
  return <div className="site-header-skeleton" aria-hidden="true"><BrandMarkSkeleton /><span className="site-header-skeleton__navigation" /></div>
}
