import './PhotoPlaceholder.css'

export default function PhotoPlaceholder({ orientation = 'landscape' }) {
  return (
    <div className={`photo-placeholder photo-placeholder--${orientation}`} aria-hidden="true">
      <span className="photo-placeholder__symbol" aria-hidden="true" />
    </div>
  )
}
