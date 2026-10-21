import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PrivacyPage from './PrivacyPage.jsx'
import PrivacyPageSkeleton from './PrivacyPageSkeleton.jsx'

describe('PrivacyPage', () => {
  it('identifica que el texto es un borrador pendiente de aprobación', () => {
    render(<PrivacyPage />)
    expect(screen.getByRole('status')).toHaveTextContent(/completar y aprobar/i)
    expect(screen.getByRole('heading', { name: 'Responsable del tratamiento' })).toBeInTheDocument()
  })

  it('ofrece un skeleton propio', () => {
    render(<PrivacyPageSkeleton />)
    expect(screen.getByLabelText('Cargando privacidad')).toHaveAttribute('aria-busy', 'true')
  })
})
