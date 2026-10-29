import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteContentProvider } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import HomePage from './HomePage.jsx'
import HomePageSkeleton from './HomePageSkeleton.jsx'

describe('HomePage', () => {
  it('ofrece consulta, cursos y naturaleza desde las acciones del héroe', () => {
    render(<SiteContentProvider><HomePage /></SiteContentProvider>)
    const hero = screen.getByRole('region', { name: /cuidar tu salud también/i })
    const links = within(hero).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/consulta', '/cursos', '/naturaleza'])
    expect(within(hero).getByRole('link', { name: 'Reconecta con la naturaleza' })).toHaveClass('action-link--text')
  })

  it('usa MAYA-844 junto a la biografía del inicio', () => {
    render(<SiteContentProvider><HomePage /></SiteContentProvider>)
    const photo = screen.getByRole('img', { name: 'Nicolás Zamara sentado en un jardín' })
    expect(photo).toHaveAttribute('src', '/photos/sobre-mi-maya-844-960.jpg')
    expect(photo).toHaveAttribute('srcset', '/photos/sobre-mi-maya-844-480.jpg 480w, /photos/sobre-mi-maya-844-960.jpg 960w')
    expect(photo).toHaveAttribute('loading', 'lazy')
    expect(photo.closest('section')).toHaveAttribute('id', 'sobre-mi')
    expect(photo.nextElementSibling).toContainElement(screen.getByRole('heading', { name: 'Hola, soy Nicolás.' }))
  })
  it('usa la fotografía del curso en la sección Flores de Bach', () => {
    render(<SiteContentProvider><HomePage /></SiteContentProvider>)
    const photo = screen.getByRole('img', { name: 'Presentación de botánica con una flor amarilla proyectada en pantalla' })
    expect(photo).toHaveAttribute('src', '/photos/presentacion-botanica-1280.jpg')
    expect(photo).toHaveAttribute('srcset', '/photos/presentacion-botanica-640.jpg 640w, /photos/presentacion-botanica-1280.jpg 1280w')
    expect(photo.closest('section')).toHaveAttribute('aria-labelledby', 'home-course-title')
    expect(screen.getByRole('link', { name: 'Más información' })).toHaveAttribute('href', '/naturaleza')
  })
  it('muestra las etiquetas y el enlace de interés online aprobados', () => {
    const { container } = render(<SiteContentProvider><HomePage /></SiteContentProvider>)
    expect(container.querySelector('.home-consult-band__label')).toBeNull()
    expect(container.querySelector('.home-nature__label')).toHaveTextContent('Naturaleza y bienestar')
    expect(screen.getByRole('link', { name: 'Me interesa la modalidad online' })).toHaveAttribute('href', '/cursos#interes-online')
  })
  it('presenta las tres áreas y los accesos a consulta y formación', () => {
    render(<SiteContentProvider><HomePage /></SiteContentProvider>)
    expect(screen.getByRole('heading', { name: /cuidar tu salud también es atender cómo te sientes/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /conoce la consulta/i })).toHaveAttribute('href', '/consulta')
    expect(screen.getByRole('heading', { name: 'Consulta y terapias' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cursos y formación' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Naturaleza y bienestar' })).toBeInTheDocument()
  })

  it('muestra el skeleton de inicio mientras se prepara la página', () => {
    const { container } = render(<HomePageSkeleton />)
    expect(screen.getByLabelText('Cargando inicio')).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelectorAll('.home-page-skeleton__action')).toHaveLength(3)
    expect(container.querySelector('.home-page-skeleton__portrait')).toBeInTheDocument()
  })

  it('acompaña el hero con la fotografía de terapias integrales y variantes adaptables', () => {
    render(<SiteContentProvider><HomePage /></SiteContentProvider>)
    const photo = screen.getByRole('img', { name: 'Nicolás Zamara conversando en su consulta' })
    expect(photo).toHaveAttribute('src', '/photos/terapias-integrales-960.jpg')
    expect(photo).toHaveAttribute('srcset', '/photos/terapias-integrales-480.jpg 480w, /photos/terapias-integrales-960.jpg 960w')
    expect(photo).toHaveAttribute('fetchpriority', 'high')
    expect(photo.closest('section')).toHaveAttribute('aria-labelledby', 'home-title')
  })

  it('muestra contemplando junto al texto de naturaleza', () => {
    render(<SiteContentProvider><HomePage /></SiteContentProvider>)
    const photo = screen.getByRole('img', { name: 'Una persona contemplando un lago turquesa rodeado de montañas nevadas' })
    expect(photo).toHaveAttribute('src', '/photos/contemplando-1200.jpg')
    expect(photo).toHaveAttribute('srcset', '/photos/contemplando-600.jpg 600w, /photos/contemplando-1200.jpg 1200w')
    expect(photo).toHaveAttribute('loading', 'lazy')
    expect(photo.closest('section')).toHaveAttribute('id', 'naturaleza')
    expect(photo.parentElement.nextElementSibling).toContainElement(screen.getByRole('heading', { name: 'Darte tiempo para estar en la naturaleza.' }))
  })
})
