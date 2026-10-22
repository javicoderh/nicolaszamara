import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteContentProvider } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import HomePage from './HomePage.jsx'
import HomePageSkeleton from './HomePageSkeleton.jsx'

describe('HomePage', () => {
  it('presenta las tres áreas y los accesos a consulta y formación', () => {
    render(<SiteContentProvider><HomePage /></SiteContentProvider>)
    expect(screen.getByRole('heading', { name: /cuidar tu salud también es atender cómo te sientes/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /conoce la consulta/i })).toHaveAttribute('href', '/consulta')
    expect(screen.getByRole('heading', { name: 'Consulta y terapias' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cursos y formación' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Naturaleza y bienestar' })).toBeInTheDocument()
  })

  it('muestra el skeleton de inicio mientras se prepara la página', () => {
    render(<HomePageSkeleton />)
    expect(screen.getByLabelText('Cargando inicio')).toHaveAttribute('aria-busy', 'true')
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
