import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteContentProvider } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import TherapiesPage from './TherapiesPage.jsx'
import TherapiesPageSkeleton from './TherapiesPageSkeleton.jsx'

describe('TherapiesPage', () => {
  it('presenta los ocho servicios de la referencia y permite continuar a la consulta', () => {
    render(<SiteContentProvider><TherapiesPage /></SiteContentProvider>)
    expect(screen.getByRole('heading', { level: 1, name: 'Terapias' })).toBeInTheDocument()
    const services = ['Acupuntura', 'Moxibustión', 'Ventosaterapia', 'Tuina', 'Flores de Bach', 'Medicina Bioenergética', 'Iridología', 'Meditación y Mindfulness']
    expect(screen.getAllByRole('article')).toHaveLength(services.length)
    services.forEach((name) => expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /Conocer la consulta/ })).toHaveAttribute('href', '/consulta')
  })

  it('recibe el catálogo desde el contexto y lo entrega a las tarjetas', () => {
    render(<SiteContentProvider value={{ therapies: [{ id: 'prueba', name: 'Servicio de prueba', photo: { src: '/prueba.jpeg', x: 0, y: 0 } }] }}><TherapiesPage /></SiteContentProvider>)
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Servicio de prueba' })).toBeInTheDocument()
  })

  it('ofrece un skeleton con espacio para los ocho servicios', () => {
    const { container } = render(<TherapiesPageSkeleton />)
    expect(screen.getByLabelText('Cargando terapias')).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelectorAll('.therapy-card-skeleton')).toHaveLength(8)
  })
})
