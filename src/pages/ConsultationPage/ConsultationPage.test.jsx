import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteContentProvider } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import ConsultationPage from './ConsultationPage.jsx'
import ConsultationPageSkeleton from './ConsultationPageSkeleton.jsx'

describe('ConsultationPage', () => {
  it('explica evaluación individual y no promete una reserva', () => {
    render(<SiteContentProvider><ConsultationPage /></SiteContentProvider>)
    expect(screen.getByText(/No necesitas saber de antemano/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Solicita tu atención.' })).toBeInTheDocument()
    expect(screen.queryByText(/versión de pruebas/i)).not.toBeInTheDocument()
    const section = screen.getByRole('region', { name: 'Dónde atiendo' })
    expect(section.id).toBe('lugares-de-atencion')
    expect(section.querySelector('h3')).toHaveTextContent('Villa Vida Natural')
    expect(screen.getByRole('link', { name: 'Consultar atención en Evaluz' }).href).toContain('https://wa.me/56953961219?text=')
    expect(section.querySelectorAll('a[href*="google.com/maps/search/"]')).toHaveLength(2)
    expect(section.compareDocumentPosition(document.getElementById('interes-consulta')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('ofrece un skeleton propio', () => {
    const { container } = render(<ConsultationPageSkeleton />)
    expect(screen.getByLabelText('Cargando consulta')).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelector('.consult-skeleton__photo')).toBeInTheDocument()
    expect(container.querySelector('.consult-skeleton__title')).toBeInTheDocument()
    expect(container.querySelector('.interest-form-skeleton')).toBeInTheDocument()
  })

  it('presenta la foto MAYA-925 antes del texto dentro del hero', () => {
    render(<SiteContentProvider><ConsultationPage /></SiteContentProvider>)
    const photo = screen.getByRole('img', { name: 'Nicolás Zamara conversando con una persona en su consulta' })
    expect(photo).toHaveAttribute('src', '/photos/consulta-maya-925-960.jpg')
    expect(photo).toHaveAttribute('srcset', '/photos/consulta-maya-925-480.jpg 480w, /photos/consulta-maya-925-960.jpg 960w')
    expect(photo).toHaveAttribute('fetchpriority', 'high')
    expect(photo.parentElement).toHaveClass('consult-page__photo-frame')
    expect(photo.parentElement.nextElementSibling).toBe(screen.getByRole('heading', { level: 1 }))
    expect(photo.parentElement.parentElement).toHaveClass('consult-page__intro')
  })
})
