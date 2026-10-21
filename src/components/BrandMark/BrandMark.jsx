import './BrandMark.css'

export default function BrandMark({ name, descriptor, className = '' }) {
  return (
    <span className={`brand-mark ${className}`.trim()}>
      <span className="brand-mark__name">{name}</span>
      {descriptor && <span className="brand-mark__descriptor">{descriptor}</span>}
    </span>
  )
}
