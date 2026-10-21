import './PhotoPlaceholder.css'

export default function PhotoPlaceholder({ label, orientation = 'landscape' }) {
  return (
    <figure className={`photo-placeholder photo-placeholder--${orientation}`} role="img" aria-label={label}>
      <span className="photo-placeholder__symbol" aria-hidden="true">✳</span>
      <figcaption>{label}</figcaption>
    </figure>
  )
}
