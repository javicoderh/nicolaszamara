import { aboutContent } from '../../content/siteContent.js'
import './AboutPage.css'

export default function AboutPage() {
  return (
    <main id="main-content" className="about-page page-wrap">
      <img
        className="about-page__photo"
        src="/photos/sobre-mi-maya-844-960.jpg"
        srcSet="/photos/sobre-mi-maya-844-480.jpg 480w, /photos/sobre-mi-maya-844-960.jpg 960w"
        sizes="(max-width: 700px) calc(100vw - 40px), 420px"
        alt="Nicolás Zamara sentado en un jardín"
        width="960"
        height="1439"
        fetchPriority="high"
        decoding="async"
      />
      <div className="about-page__copy">
        <p className="about-page__label">Sobre mí</p>
        <h1>{aboutContent.title}</h1>
        {aboutContent.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </main>
  )
}
