// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { renderRoute } from './entry-server.jsx'

describe('static route rendering', () => {
  it.each([
    ['/', 'Cuidar tu salud'], ['/consulta', 'Cada consulta, con claridad'], ['/cursos', 'Aprender para acompañar'],
    ['/naturaleza', 'Darte tiempo para estar'], ['/sobre-mi', 'Hola, soy Nicolás.'], ['/terapias', 'Servicios de terapias'],
    ['/privacidad', 'Preferencias de medición opcional'], ['/chatbot', 'Conversación'],
  ])('renders %s with real content without a browser or provider requests', (path, text) => {
    const fetch = vi.fn(() => { throw Error('No network permitted') })
    vi.stubGlobal('fetch', fetch)
    try {
      const html = renderRoute(path)
      expect(html).toContain(text)
      expect(html).toContain('site-app__page-content')
      expect(html).toContain('site-app__loading-skeleton')
      expect((html.match(/id="main-content"/g) || [])).toHaveLength(1)
      expect(html).not.toContain('googletagmanager.com')
      expect(fetch).not.toHaveBeenCalled()
    } finally { vi.unstubAllGlobals() }
  })
  it('disables static form submissions and renders a helpful unknown route', () => {
    expect(renderRoute('/consulta')).toContain('<fieldset disabled=""')
    expect(renderRoute('/404')).toContain('Este camino todavía no está en el mapa')
  })
  it('renders only a private loading shell for administration, without records or credentials', () => {
    const html = renderRoute('/admin')
    expect(html).toContain('Cargando administración')
    expect(html).not.toContain('type="password"')
    expect(html).not.toContain('chatbot__')
    expect(html).not.toContain('analytics-consent')
    expect(html.match(/id="main-content"/g)).toHaveLength(1)
  })
})
