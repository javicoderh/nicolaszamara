import { describe, expect, it, vi } from 'vitest'
import { trackEvent } from './analyticsService.js'
import { analyticsAllowed } from './analyticsPermission.js'
vi.mock('./analyticsPermission.js', () => ({ analyticsAllowed: vi.fn(() => true) }))

describe('trackEvent', () => {
  it('does not emit without analytics permission', () => {
    const listener = vi.fn()
    window.addEventListener('nzamara:metric', listener)
    vi.mocked(analyticsAllowed).mockReturnValueOnce(false)
    expect(trackEvent('whatsapp_click')).toBe(false)
    expect(listener).not.toHaveBeenCalled()
    window.removeEventListener('nzamara:metric', listener)
  })
  it('publica solo el nombre del evento permitido, sin datos personales', () => {
    const listener = vi.fn()
    window.addEventListener('nzamara:metric', listener, { once: true })
    expect(trackEvent('hotmart_click')).toBe(true)
    expect(listener.mock.calls[0][0].detail).toEqual({ eventName: 'hotmart_click' })
  })

  it('descarta eventos no permitidos', () => {
    expect(trackEvent('user_email')).toBe(false)
  })
})
