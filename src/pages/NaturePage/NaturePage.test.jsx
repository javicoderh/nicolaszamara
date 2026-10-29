import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import NaturePage from './NaturePage.jsx'
import NaturePageSkeleton from './NaturePageSkeleton.jsx'

describe('NaturePage', () => {
  it('presenta naturaleza y su propio formulario de interés', () => {
    render(<NaturePage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Darte tiempo para estar en la naturaleza.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Me interesan los baños de bosque' })).toHaveAttribute('href', '#interes-naturaleza')
    expect(screen.getByRole('region', { name: 'Registro de interés en naturaleza' })).toHaveAttribute('id', 'interes-naturaleza')
    expect(screen.getByRole('heading', { name: 'Me interesan los baños de bosque' })).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', '/photos/contemplando-1200.jpg')
    expect(screen.queryByText('Hola, soy Nicolás.')).not.toBeInTheDocument()
    expect(screen.queryByText('Flores de Bach para la vida cotidiana')).not.toBeInTheDocument()
  })

  it('reserva espacio para la fotografía, el texto y el formulario al cargar', () => {
    const { container } = render(<NaturePageSkeleton />)
    expect(screen.getByLabelText('Cargando naturaleza')).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelectorAll('.nature-skeleton__hero span')).toHaveLength(2)
    expect(container.querySelector('.interest-form-skeleton')).toBeInTheDocument()
  })
})
