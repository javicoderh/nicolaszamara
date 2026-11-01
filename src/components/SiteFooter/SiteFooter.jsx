import { useSiteContent } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import BrandMark from '../BrandMark/BrandMark.jsx'
import './SiteFooter.css'
import { navigationParams } from '../../services/analyticsSensors.js'
import { trackEvent } from '../../services/analyticsService.js'

export default function SiteFooter({ onOpenAnalytics }) {
  const { brand, descriptor, contact, socialLinks } = useSiteContent()
  return (
    <footer className="site-footer">
      <img className="site-footer__flowers" src="/brand/poppy-line.svg" alt="" aria-hidden="true" width="240" height="255" />
      <img className="site-footer__needles" src="/brand/acupuncture-line.svg" alt="" aria-hidden="true" width="210" height="240" />
      <div className="site-footer__inner">
        <a className="site-footer__brand" href="/" aria-label={`${brand}, inicio`} onClick={() => trackEvent('navigation_click', { element_id: 'footer_home', placement: 'footer', destination_path: '/' })}><BrandMark name={brand} descriptor={descriptor} /></a>
        <nav className="site-footer__links" aria-label="Enlaces del pie de página" onClick={(event) => {
          const params = navigationParams(event.target.closest('a')?.getAttribute('href'), 'footer')
          if (params) trackEvent('navigation_click', params)
        }}>
          <div><h2>Consulta</h2><a href="/consulta">La consulta</a><a href="/consulta#consult-steps-title">Cómo comenzar</a><a href="/consulta#consult-contact-title">Disponibilidad</a></div>
          <div><h2>Naturaleza</h2><a href="/naturaleza">Naturaleza y bienestar</a><a href="/naturaleza#interes-naturaleza">Recibir información</a><a href="/sobre-mi">Sobre mí</a></div>
          <div><h2>Cursos</h2><a href="/cursos">Flores de Bach</a><a href="/cursos#interes-online">Curso online</a></div>
          <div><h2>Información</h2><a href="/privacidad">Privacidad</a>{contact.email && <a href={`mailto:${contact.email}`}>Correo</a>}{socialLinks.map((social) => <a key={social.href} href={social.href} target="_blank" rel="noreferrer">{social.label}</a>)}</div>
        </nav>
        <div className="site-footer__bottom"><small>© {new Date().getFullYear()} {brand} <span aria-hidden="true">|</span> Todos los derechos reservados</small>
          {onOpenAnalytics && <button className="site-footer__preferences" type="button" onClick={onOpenAnalytics}>Preferencias de privacidad</button>}
        </div>
      </div>
    </footer>
  )
}
