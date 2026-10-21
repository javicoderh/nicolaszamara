import './PhotoPlaceholderSkeleton.css'

export default function PhotoPlaceholderSkeleton({ orientation = 'landscape' }) {
  return <div className={`photo-skeleton photo-skeleton--${orientation}`} aria-hidden="true"><span /></div>
}
