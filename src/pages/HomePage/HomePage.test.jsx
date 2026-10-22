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
})
