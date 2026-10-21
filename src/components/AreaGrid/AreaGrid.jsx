import ActionLink from '../ActionLink/ActionLink.jsx'
import './AreaGrid.css'

export default function AreaGrid({ areas }) {
  return (
    <div className="area-grid">
      {areas.map((area) => (
        <article className="area-card" key={area.number}>
          <span className="area-card__number">{area.number}</span>
          <h3>{area.title}</h3>
          <p>{area.description}</p>
          <ActionLink className="area-card__link" href={area.href} variant="text">{area.link} <span aria-hidden="true">→</span></ActionLink>
        </article>
      ))}
    </div>
  )
}
