import './BrandMark.css'

export default function BrandMark({ name, descriptor, className = '' }) {
  return (
    <span className={`brand-mark ${className}`.trim()}>
      <img className="brand-mark__logo" src="/brand/nicolas-zamara-logo.svg" alt={name} width="1085" height="310" />
      {descriptor && <span className="brand-mark__descriptor">{descriptor}</span>}
    </span>
  )
}
