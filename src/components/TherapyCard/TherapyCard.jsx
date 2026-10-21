import './TherapyCard.css'

export default function TherapyCard({ id, name, photo }) {
  return (
    <article className="therapy-card" aria-labelledby={`therapy-${id}`}>
      <div className="therapy-card__photo" style={{ '--crop-x': photo.x, '--crop-y': photo.y }}>
        <img src={photo.src} alt="" width="1352" height="575" decoding="async" />
      </div>
      <h2 id={`therapy-${id}`}>{name}</h2>
    </article>
  )
}
