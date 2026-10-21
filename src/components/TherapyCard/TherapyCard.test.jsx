import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TherapyCard from './TherapyCard.jsx'
import TherapyCardSkeleton from './TherapyCardSkeleton.jsx'

describe('TherapyCard', () => {
  it('presenta el servicio recibido y su fotografía sin duplicar el nombre accesible', () => {
    render(<TherapyCard id="tuina" name="Tuina" photo={{ src: '/tuina.jpeg', x: 95, y: 148 }} />)
    expect(screen.getByRole('article', { name: 'Tuina' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Tuina' })).toBeInTheDocument()
    expect(screen.getByAltText('')).toHaveAttribute('src', '/tuina.jpeg')
  })

  it('reserva la imagen circular y el título en su skeleton decorativo', () => {
    const { container } = render(<TherapyCardSkeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.firstChild.children).toHaveLength(2)
  })
})
