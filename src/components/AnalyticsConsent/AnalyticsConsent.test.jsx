import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AnalyticsConsent from './AnalyticsConsent.jsx'
import AnalyticsConsentSkeleton from './AnalyticsConsentSkeleton.jsx'
import { UNKNOWN_CONSENT } from '../../services/consentService.js'

describe('AnalyticsConsent', () => {
  it('offers equally available acceptance and rejection without selecting categories', () => {
    const save = vi.fn()
    render(<AnalyticsConsent consent={UNKNOWN_CONSENT} onSave={save} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar opcionales' }))
    expect(save).toHaveBeenLastCalledWith({ analytics: false, experience: false })
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar opcionales' }))
    expect(save).toHaveBeenLastCalledWith({ analytics: true, experience: true })
    expect(screen.queryByRole('button', { name: 'Cerrar preferencias' })).not.toBeInTheDocument()
  })
  it('saves categories independently and does not touch form consents', () => {
    const save = vi.fn()
    render(<AnalyticsConsent consent={UNKNOWN_CONSENT} onSave={save} />)
    fireEvent.click(screen.getByRole('button', { name: 'Configurar' }))
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.every((input) => !input.checked)).toBe(true)
    fireEvent.click(screen.getByRole('checkbox', { name: /mapas de interacción/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar preferencias' }))
    expect(save).toHaveBeenCalledWith({ analytics: false, experience: true })
  })
  it('can close existing preferences and displays a noninteractive skeleton immediately', () => {
    const close = vi.fn()
    const { rerender, container } = render(<AnalyticsConsent consent={{ ...UNKNOWN_CONSENT, status: 'rejected' }} onClose={close} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar preferencias' }))
    expect(close).toHaveBeenCalledOnce()
    rerender(<AnalyticsConsentSkeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
