import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import NaturePage from './NaturePage.jsx'
import NaturePageSkeleton from './NaturePageSkeleton.jsx'

describe('NaturePage', () => {
  it('presenta naturaleza y su propio formulario de interés', () => {
    render(<NaturePage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Baños de bosque: un espacio para bajar el ritmo y conectar con la naturaleza.' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Consultar por baños de bosque' })[0]).toHaveAttribute('href', `https://wa.me/56953961219?text=${encodeURIComponent('Hola, Nicolás. Vi los baños de bosque en tu web y me gustaría conocer las fechas y los detalles para participar.')}`)
    expect(screen.getByRole('region', { name: 'Registro de interés en naturaleza' })).toHaveAttribute('id', 'interes-naturaleza')
    expect(screen.getByRole('heading', { name: 'Recibe información sobre las jornadas.' })).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', '/photos/contemplando-1200.jpg')
    expect(screen.queryByText('Soy Nicolás Zamara.')).not.toBeInTheDocument()
    expect(screen.queryByText('Flores de Bach para la vida cotidiana')).not.toBeInTheDocument()
  })

  it('reserva espacio para la fotografía, el texto y el formulario al cargar', () => {
    const { container } = render(<NaturePageSkeleton />)
    expect(screen.getByLabelText('Cargando naturaleza')).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelectorAll('.nature-skeleton__hero span')).toHaveLength(2)
    expect(container.querySelector('.interest-form-skeleton')).toBeInTheDocument()
  })
})
