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
  })

  it('ofrece un skeleton propio', () => {
    render(<ConsultationPageSkeleton />)
    expect(screen.getByLabelText('Cargando consulta')).toHaveAttribute('aria-busy', 'true')
  })
})
