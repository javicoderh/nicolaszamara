import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PrivacyPage from './PrivacyPage.jsx'
import PrivacyPageSkeleton from './PrivacyPageSkeleton.jsx'

describe('PrivacyPage', () => {
  it('explica el uso de datos sin avisos de prueba ni instrucciones internas', () => {
    render(<PrivacyPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Privacidad' })).toBeInTheDocument()
    expect(screen.getByText(/se guardan tu nombre, correo electrónico/i)).toBeInTheDocument()
    expect(screen.queryByText(/pruebas|ficticios|revisión del sitio|pendiente|completar y aprobar/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('ofrece un skeleton propio', () => {
    render(<PrivacyPageSkeleton />)
    expect(screen.getByLabelText('Cargando privacidad')).toHaveAttribute('aria-busy', 'true')
  })
})
