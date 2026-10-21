import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ActionLink from './ActionLink.jsx'
import ActionLinkSkeleton from './ActionLinkSkeleton.jsx'

describe('ActionLink', () => {
  it('aplica la variante solicitada y conserva atributos de enlace', () => {
    render(<ActionLink href="/consulta" variant="light" target="_blank">Consultar</ActionLink>)
    const link = screen.getByRole('link', { name: 'Consultar' })
    expect(link).toHaveClass('action-link--light')
    expect(link).toHaveAttribute('href', '/consulta')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('ofrece un skeleton propio', () => {
    const { container } = render(<ActionLinkSkeleton />)
    expect(container.firstChild).toHaveClass('action-link-skeleton')
  })
})
