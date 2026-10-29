import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteContentProvider } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import ConsultationPage from './ConsultationPage.jsx'
import ConsultationPageSkeleton from './ConsultationPageSkeleton.jsx'

describe('ConsultationPage', () => {
  it('explica evaluación individual y no promete una reserva', () => {
    render(<SiteContentProvider><ConsultationPage /></SiteContentProvider>)
    expect(screen.getByText(/La acupuntura y las técnicas complementarias se eligen según cada caso/i)).toBeInTheDocument()
    const whatsapp = screen.getByRole('link', { name: /Consultar disponibilidad por WhatsApp/i })
    expect(whatsapp).toHaveAttribute('href', `https://wa.me/56953961219?text=${encodeURIComponent('Hola, quisiera consultar disponibilidad para una sesión.')}`)
    expect(whatsapp).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('heading', { name: 'Me interesa agendar una consulta' })).toBeInTheDocument()
    expect(screen.queryByRole('definition')).not.toBeInTheDocument()
    expect(screen.getByText(/versión de pruebas/i)).toBeInTheDocument()
  })

  it('presenta únicamente los datos prácticos configurados', () => {
    render(<SiteContentProvider value={{ contact: { address: 'Dirección confirmada', sessionDuration: '60 minutos' } }}><ConsultationPage /></SiteContentProvider>)
    expect(screen.getAllByRole('term')).toHaveLength(2)
    expect(screen.getByText('Dirección confirmada')).toBeInTheDocument()
    expect(screen.getByText('60 minutos')).toBeInTheDocument()
    expect(screen.queryByText('Valor')).not.toBeInTheDocument()
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
