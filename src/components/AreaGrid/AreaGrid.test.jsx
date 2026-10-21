import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AreaGrid from './AreaGrid.jsx'
import AreaGridSkeleton from './AreaGridSkeleton.jsx'

describe('AreaGrid', () => {
  it('representa cada área como contenido enlazado', () => {
    render(<AreaGrid areas={[{ number: '01', title: 'Consulta', description: 'Atención', href: '/consulta', link: 'Conocer consulta' }]} />)
    expect(screen.getByRole('heading', { name: 'Consulta' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /conocer consulta/i })).toHaveAttribute('href', '/consulta')
  })

  it('ofrece un skeleton propio', () => {
    const { container } = render(<AreaGridSkeleton />)
    expect(container.firstChild).toHaveClass('area-grid-skeleton')
  })
})
