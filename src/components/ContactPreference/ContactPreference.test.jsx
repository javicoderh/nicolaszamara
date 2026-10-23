import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ContactPreference from './ContactPreference.jsx'

describe('ContactPreference', () => {
  it('offers three required icon choices with no default and only one selected value', () => {
    const { container } = render(<form aria-label="Preferencia"><ContactPreference /></form>)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(radios.every((radio) => radio.required && !radio.checked)).toBe(true)
    expect(container.querySelectorAll('svg[aria-hidden=true]')).toHaveLength(3)
    fireEvent.click(screen.getByRole('radio', { name: 'Videollamada' }))
    fireEvent.click(screen.getByRole('radio', { name: 'WhatsApp' }))
    expect(screen.getByRole('radio', { name: 'WhatsApp' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Videollamada' })).not.toBeChecked()
    expect(new FormData(screen.getByRole('form')).get('contactPreference')).toBe('whatsapp')
  })
  it.each(['Videollamada', 'Teléfono', 'WhatsApp'])('shows the %s tooltip on hover and hides it when leaving', (label) => {
    render(<ContactPreference />)
    const option = screen.getByRole('radio', { name: label }).closest('label')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.mouseEnter(option)
    expect(screen.getByRole('tooltip')).toHaveTextContent(label)
    fireEvent.mouseLeave(option)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
  it('also describes keyboard focus, allows Escape, and reports the chosen value', () => {
    const onChange = vi.fn()
    render(<ContactPreference value="" onChange={onChange} />)
    const radio = screen.getByRole('radio', { name: 'Teléfono' })
    fireEvent.focus(radio)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Teléfono')
    expect(radio).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id)
    fireEvent.keyDown(radio, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.click(radio)
    expect(onChange).toHaveBeenCalledOnce()
    fireEvent.blur(radio)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
