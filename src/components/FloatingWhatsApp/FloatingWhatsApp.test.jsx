import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FloatingWhatsApp from './FloatingWhatsApp.jsx'
import FloatingWhatsAppSkeleton from './FloatingWhatsAppSkeleton.jsx'

describe('FloatingWhatsApp', () => {
  it('abre el número configurado y registra únicamente el evento de clic', () => {
    render(<FloatingWhatsApp phoneNumber="+56 9 5396 1219" />)
    const link = screen.getByRole('link', { name: 'Contactar por WhatsApp (abre en otra pestaña)' })
    expect(link).toHaveAttribute('href', 'https://wa.me/56953961219')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    const listener = vi.fn()
    window.addEventListener('nzamara:metric', listener, { once: true })
    fireEvent.click(link)
    expect(listener.mock.calls[0][0].detail).toEqual({ eventName: 'whatsapp_click' })
  })

  it('omite el enlace cuando no existe un número', () => {
    const { container } = render(<FloatingWhatsApp phoneNumber="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('ofrece un skeleton inmediato sin controles interactivos', () => {
    const { container } = render(<FloatingWhatsAppSkeleton />)
    expect(container.firstChild).toHaveClass('floating-whatsapp-skeleton')
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
