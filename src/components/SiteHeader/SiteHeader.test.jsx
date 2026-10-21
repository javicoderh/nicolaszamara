import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteContentProvider } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import SiteHeader from './SiteHeader.jsx'
import SiteHeaderSkeleton from './SiteHeaderSkeleton.jsx'

describe('SiteHeader', () => {
  it('muestra rutas y abre el menú móvil accesible', () => {
    render(<SiteContentProvider><SiteHeader /></SiteContentProvider>)
    const toggle = screen.getByRole('button', { name: /menú/i })
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Consulta' })).toHaveAttribute('href', '/consulta')
    expect(screen.getByRole('link', { name: 'Terapias' })).toHaveAttribute('href', '/terapias')
  })

  it('ofrece un skeleton propio', () => {
    const { container } = render(<SiteHeaderSkeleton />)
    expect(container.firstChild).toHaveClass('site-header-skeleton')
  })

  it('cierra el menú con Escape y devuelve el foco al control', () => {
    render(<SiteContentProvider><SiteHeader /></SiteContentProvider>)
    const toggle = screen.getByRole('button', { name: /menú/i })
    fireEvent.click(toggle)
    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' })
    fireEvent.keyDown(navigation, { key: 'Escape' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
  })
})
