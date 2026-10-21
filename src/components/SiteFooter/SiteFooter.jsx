import { useSiteContent } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import './SiteFooter.css'

export default function SiteFooter() {
  const { brand, descriptor, contact, socialLinks } = useSiteContent()
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <a className="site-footer__brand" href="/">{brand}</a>
        <p>{descriptor}</p>
        <nav aria-label="Enlaces del pie de página">
          <a href="/consulta">Consulta</a><a href="/cursos">Cursos</a><a href="/privacidad">Privacidad</a>
          {contact.email && <a href={`mailto:${contact.email}`}>Correo</a>}
          {socialLinks.map((social) => <a key={social.href} href={social.href} target="_blank" rel="noreferrer">{social.label}</a>)}
        </nav>
        <small>© {new Date().getFullYear()} {brand}</small>
      </div>
    </footer>
  )
}
