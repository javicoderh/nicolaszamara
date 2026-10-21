import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteContentProvider } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import ConsultationPage from './ConsultationPage.jsx'
import ConsultationPageSkeleton from './ConsultationPageSkeleton.jsx'

describe('ConsultationPage', () => {
  it('explica evaluación individual y no promete una reserva', () => {
    render(<SiteContentProvider><ConsultationPage /></SiteContentProvider>)
    expect(screen.getByText(/Las alternativas se revisan de forma individual/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('número de WhatsApp está pendiente')
    expect(screen.queryByRole('link', { name: /whatsapp/i })).not.toBeInTheDocument()
  })

  it('ofrece un skeleton propio', () => {
    render(<ConsultationPageSkeleton />)
    expect(screen.getByLabelText('Cargando consulta')).toHaveAttribute('aria-busy', 'true')
  })
})
