import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PrivacyPage from './PrivacyPage.jsx'
import PrivacyPageSkeleton from './PrivacyPageSkeleton.jsx'

describe('PrivacyPage', () => {
  it('conserva el aviso de pruebas sin instrucciones internas', () => {
    render(<PrivacyPage />)
    expect(screen.getByRole('status')).toHaveTextContent(/versión de pruebas: utiliza datos ficticios/i)
    expect(screen.queryByText(/pendiente|completar y aprobar/i)).not.toBeInTheDocument()
  })

  it('ofrece un skeleton propio', () => {
    render(<PrivacyPageSkeleton />)
    expect(screen.getByLabelText('Cargando privacidad')).toHaveAttribute('aria-busy', 'true')
  })
})
