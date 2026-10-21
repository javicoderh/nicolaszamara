import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PhotoPlaceholder from './PhotoPlaceholder.jsx'
import PhotoPlaceholderSkeleton from './PhotoPlaceholderSkeleton.jsx'

describe('PhotoPlaceholder', () => {
  it('identifica el recurso original que falta', () => {
    render(<PhotoPlaceholder label="Retrato en consulta pendiente de entrega" orientation="portrait" />)
    expect(screen.getByRole('img', { name: 'Retrato en consulta pendiente de entrega' })).toBeInTheDocument()
  })

  it('ofrece un skeleton propio', () => {
    const { container } = render(<PhotoPlaceholderSkeleton />)
    expect(container.firstChild).toHaveClass('photo-skeleton')
  })
})
