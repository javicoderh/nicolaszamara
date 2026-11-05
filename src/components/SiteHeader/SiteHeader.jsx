import { useRef, useState } from 'react'
import { useSiteContent } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import ActionLink from '../ActionLink/ActionLink.jsx'
import BrandMark from '../BrandMark/BrandMark.jsx'
import './SiteHeader.css'
import { navigationParams } from '../../services/analyticsSensors.js'
import { trackEvent } from '../../services/analyticsService.js'

const navigation = [
  { label: 'Inicio', href: '/' },
  { label: 'Terapias', href: '/terapias' },
  { label: 'Consulta', href: '/consulta' },
  { label: 'Cursos', href: '/cursos' },
  { label: 'Naturaleza', href: '/naturaleza' },
  { label: 'Blog', href: '/blog' },
  { label: 'Sobre mí', href: '/sobre-mi' },
]

export default function SiteHeader({ currentPath = typeof window === 'undefined' ? '/' : window.location.pathname }) {
  const { brand } = useSiteContent()
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef(null)

  return (
    <header className="site-header">
      <a className="site-header__brand" href="/" aria-label={`${brand}, inicio`} onClick={() => trackEvent('navigation_click', { element_id: 'brand_home', placement: 'header', destination_path: '/' })}>
        <BrandMark name={brand} />
      </a>
      <button
        ref={toggleRef}
        className="site-header__toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="site-header__toggle-label">{menuOpen ? 'Cerrar menú' : 'Menú'}</span>
        <span className="site-header__toggle-icon" aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
      </button>
      <nav
        id="primary-navigation"
        className={`site-header__nav${menuOpen ? ' is-open' : ''}`}
        aria-label="Navegación principal"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setMenuOpen(false)
            toggleRef.current?.focus()
          }
        }}
      >
        {navigation.map((item) => <a key={item.href} href={item.href} aria-current={currentPath === item.href ? 'page' : undefined} onClick={() => {
          setMenuOpen(false)
          const params = navigationParams(item.href, 'header')
          if (params) trackEvent('navigation_click', params)
        }}>{item.label}</a>)}
        <ActionLink analytics={{ element_id: 'header_consultation', placement: 'header', service: 'consultation' }} className="site-header__cta" href="/consulta" variant="compact">Conoce la consulta</ActionLink>
      </nav>
    </header>
  )
}
