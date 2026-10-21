import ActionLink from '../ActionLink/ActionLink.jsx'
import './AreaGrid.css'

const illustrations = [
  'M59 100V57M59 75C34 77 23 61 24 45C44 42 56 53 59 68M60 58C61 37 75 26 95 28C95 47 80 58 60 58M48 98H72M58 49C44 38 44 22 57 13C71 22 73 37 58 49',
  'M60 92C45 80 30 77 15 80V25C31 23 48 28 60 40C72 28 89 23 105 25V80C90 77 75 80 60 92ZM60 40V92M27 40C37 41 43 44 49 49M27 53C36 54 43 57 49 61M73 49C80 44 87 41 94 40M73 61C80 57 87 54 94 53',
  'M10 96L47 35L72 74L88 50L112 96ZM33 58L47 63L59 55M80 65L88 72L95 63M79 25A10 10 0 1 0 99 25A10 10 0 1 0 79 25M21 108H102',
]

export default function AreaGrid({ areas }) {
  return (
    <div className="area-grid">
      {areas.map((area, index) => (
        <article className="area-card" key={area.number}>
          <div className="area-card__visual" aria-hidden="true"><svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d={illustrations[index % illustrations.length]} /></svg></div>
          <span className="area-card__number">{area.number}</span>
          <h3>{area.title}</h3>
          <p>{area.description}</p>
          <ActionLink className="area-card__link" href={area.href} variant="text">{area.link} <span aria-hidden="true">→</span></ActionLink>
        </article>
      ))}
    </div>
  )
}
