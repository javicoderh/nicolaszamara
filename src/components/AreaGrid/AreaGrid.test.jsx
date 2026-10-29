import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AreaGrid from './AreaGrid.jsx'
import AreaGridSkeleton from './AreaGridSkeleton.jsx'
import { homeContent } from '../../content/siteContent.js'

describe('AreaGrid', () => {
  it('enlaza cada círculo al mismo destino que la acción de su columna', () => {
    const { rerender } = render(<AreaGrid areas={homeContent.areas} />)
    for (const area of homeContent.areas) {
      const visual = screen.getByRole('link', { name: `Ir a ${area.title}` })
      expect(visual).toHaveAttribute('href', area.href)
      expect(visual).toHaveAttribute('href', screen.getByRole('link', { name: area.link }).getAttribute('href'))
      expect(visual).not.toHaveAttribute('aria-hidden')
      expect(visual.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    }
    rerender(<AreaGrid areas={[{ ...homeContent.areas[0], href: '/otro-destino' }]} />)
    expect(screen.getByRole('link', { name: `Ir a ${homeContent.areas[0].title}` })).toHaveAttribute('href', '/otro-destino')
  })
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
