import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteContentProvider } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import ConsultationPage from './ConsultationPage.jsx'
import ConsultationPageSkeleton from './ConsultationPageSkeleton.jsx'

describe('ConsultationPage', () => {
  it('explica evaluación individual y no promete una reserva', () => {
    render(<SiteContentProvider><ConsultationPage /></SiteContentProvider>)
    expect(screen.getByText(/La acupuntura y las técnicas complementarias se eligen según cada caso/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('WhatsApp no está disponible')
    expect(screen.queryByRole('link', { name: /whatsapp/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('definition')).not.toBeInTheDocument()
    expect(screen.queryByText(/versión de pruebas|consulta al coordinar tu atención/i)).not.toBeInTheDocument()
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
