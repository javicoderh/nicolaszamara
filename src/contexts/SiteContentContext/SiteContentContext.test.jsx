import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteContentProvider, useSiteContent } from './SiteContentContext.jsx'

function BrandName() {
  const content = useSiteContent()
  return <span>{content.brand}</span>
}

describe('SiteContentProvider', () => {
  it('entrega el contenido compartido a sus descendientes', () => {
    render(<SiteContentProvider value={{ brand: 'Marca de prueba' }}><BrandName /></SiteContentProvider>)
    expect(screen.getByText('Marca de prueba')).toBeInTheDocument()
  })
})
