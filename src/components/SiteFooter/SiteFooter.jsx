import { useSiteContent } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import BrandMark from '../BrandMark/BrandMark.jsx'
import './SiteFooter.css'

export default function SiteFooter() {
  const { brand, descriptor, contact, socialLinks } = useSiteContent()
  return (
    <footer className="site-footer">
      <img className="site-footer__flowers" src="/brand/poppy-line.svg" alt="" aria-hidden="true" width="240" height="255" />
      <img className="site-footer__needles" src="/brand/acupuncture-line.svg" alt="" aria-hidden="true" width="210" height="240" />
      <div className="site-footer__inner">
        <a className="site-footer__brand" href="/" aria-label={`${brand}, inicio`}><BrandMark name={brand} descriptor={descriptor} /></a>
        <nav className="site-footer__links" aria-label="Enlaces del pie de página">
          <div><h2>Consulta</h2><a href="/consulta">La consulta</a><a href="/consulta#consult-steps-title">Cómo comenzar</a><a href="/consulta#consult-contact-title">Disponibilidad</a></div>
          <div><h2>Naturaleza</h2><a href="/#naturaleza">Naturaleza y bienestar</a><a href="/#interes-naturaleza">Recibir información</a><a href="/#sobre-mi">Sobre mí</a></div>
          <div><h2>Cursos</h2><a href="/cursos">Flores de Bach</a><a href="/cursos#interes-online">Futura modalidad online</a></div>
          <div><h2>Información</h2><a href="/privacidad">Privacidad</a>{contact.email && <a href={`mailto:${contact.email}`}>Correo</a>}{socialLinks.map((social) => <a key={social.href} href={social.href} target="_blank" rel="noreferrer">{social.label}</a>)}</div>
        </nav>
        <div className="site-footer__bottom"><small>© {new Date().getFullYear()} {brand} <span aria-hidden="true">|</span> Todos los derechos reservados</small></div>
      </div>
    </footer>
  )
}
