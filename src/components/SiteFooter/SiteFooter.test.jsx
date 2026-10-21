import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteContentProvider } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import SiteFooter from './SiteFooter.jsx'
import SiteFooterSkeleton from './SiteFooterSkeleton.jsx'

describe('SiteFooter', () => {
  it('muestra los enlaces y solo los contactos configurados', () => {
    render(<SiteContentProvider value={{ brand: 'Nicolás', descriptor: 'Presencia', contact: { email: '' }, socialLinks: [] }}><SiteFooter /></SiteContentProvider>)
    expect(screen.getByRole('link', { name: 'Privacidad' })).toHaveAttribute('href', '/privacidad')
    expect(screen.queryByRole('link', { name: 'Correo' })).not.toBeInTheDocument()
  })

  it('ofrece un skeleton propio', () => {
    const { container } = render(<SiteFooterSkeleton />)
    expect(container.firstChild).toHaveClass('site-footer-skeleton')
  })
})
