import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { trackEvent } from '../../services/analyticsService.js'
vi.mock('../../services/analyticsService.js', () => ({ trackEvent: vi.fn(() => true) }))
import ActionLink from './ActionLink.jsx'
import ActionLinkSkeleton from './ActionLinkSkeleton.jsx'

describe('ActionLink', () => {
  it('records an explicit internal CTA once while preserving the user action', () => {
    const onClick = vi.fn()
    document.addEventListener('click', (event) => event.preventDefault(), { once: true })
    render(<ActionLink href="/naturaleza" onClick={onClick} analytics={{ element_id: 'hero_nature', placement: 'home_hero', service: 'nature' }}>Nature</ActionLink>)
    fireEvent.click(screen.getByRole('link', { name: 'Nature' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(trackEvent).toHaveBeenCalledOnce()
    expect(trackEvent).toHaveBeenCalledWith('cta_click', { element_id: 'hero_nature', placement: 'home_hero', service: 'nature', destination_path: '/naturaleza' })
  })
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
