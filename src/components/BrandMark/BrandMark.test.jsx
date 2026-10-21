import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BrandMark from './BrandMark.jsx'
import BrandMarkSkeleton from './BrandMarkSkeleton.jsx'

describe('BrandMark', () => {
  it('respeta el nombre y el descriptor recibidos', () => {
    render(<BrandMark name="Nicolás Zamara" descriptor="Consulta y naturaleza" />)
    expect(screen.getByRole('img', { name: 'Nicolás Zamara' })).toHaveAttribute('src', '/brand/nicolas-zamara-logo.svg')
    expect(screen.queryByText('Nicolás Zamara')).not.toBeInTheDocument()
    expect(screen.getByText('Consulta y naturaleza')).toBeInTheDocument()
  })

  it('permite omitir el descriptor y presenta un skeleton decorativo', () => {
    const { container, rerender } = render(<BrandMark name="Nicolás" />)
    expect(container.querySelector('.brand-mark__descriptor')).toBeNull()
    rerender(<BrandMarkSkeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
