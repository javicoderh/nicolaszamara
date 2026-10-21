import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import InterestForm from './InterestForm.jsx'
import InterestFormSkeleton from './InterestFormSkeleton.jsx'

function fillForm(kind = 'nature') {
  fireEvent.change(screen.getByLabelText(/^nombre/i), { target: { value: 'Ana' } })
  fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'ana@example.com' } })
  fireEvent.change(screen.getByLabelText(kind === 'nature' ? /ciudad/i : /país/i), { target: { value: 'Chile' } })
  fireEvent.click(screen.getByRole('checkbox', { name: /autorizo el uso/i }))
}

describe('InterestForm', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('requiere autorización y mantiene novedades sin marcar', () => {
    const service = vi.fn()
    render(<InterestForm kind="nature" submitInterest={service} />)
    expect(screen.getByRole('checkbox', { name: /autorizo/i })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /novedades/i })).not.toBeChecked()
    fireEvent.submit(screen.getByRole('button', { name: 'Registrar mi interés' }).closest('form'))
    expect(service).not.toHaveBeenCalled()
  })

  it('muestra error honesto y conserva los campos para reintentar', async () => {
    const service = vi.fn().mockRejectedValue(new Error('offline'))
    render(<InterestForm kind="nature" submitInterest={service} />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: 'Registrar mi interés' }))
    await act(async () => { await vi.advanceTimersByTimeAsync(800) })
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos confirmar el registro')
    expect(screen.queryByText('Tu interés quedó registrado. Gracias.')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/^nombre/i)).toHaveValue('Ana')
    expect(screen.getByRole('button', { name: 'Registrar mi interés' })).toBeEnabled()
  })

  it('confirma persistencia tras 800 ms y permite un registro nuevo', async () => {
    const service = vi.fn().mockResolvedValue({ status: 'saved' })
    render(<InterestForm kind="online" submitInterest={service} />)
    fillForm('online')
    fireEvent.click(screen.getByRole('button', { name: 'Registrar mi interés' }))
    await act(async () => { await vi.advanceTimersByTimeAsync(799) })
    expect(screen.getByRole('status')).toHaveTextContent('Estamos guardando')
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    expect(screen.getByRole('status')).toHaveTextContent('Tu interés quedó registrado')
    expect(service).toHaveBeenCalledWith({ interest: 'online', values: { name: 'Ana', email: 'ana@example.com', country: 'Chile', experience: '' }, privacyConsent: true, updatesConsent: false, website: '' }, { signal: expect.any(AbortSignal) })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar otro interés' }))
    expect(screen.getByLabelText(/^nombre/i)).toHaveValue('')
    expect(screen.getByRole('checkbox', { name: /autorizo/i })).not.toBeChecked()
  })

  it('evita envíos simultáneos y diferencia límites de frecuencia', async () => {
    const service = vi.fn().mockResolvedValue({ status: 'rate_limited' })
    render(<InterestForm kind="nature" submitInterest={service} />)
    fillForm()
    const form = screen.getByRole('button', { name: 'Registrar mi interés' }).closest('form')
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(service).toHaveBeenCalledTimes(1)
    await act(async () => { await vi.advanceTimersByTimeAsync(800) })
    expect(screen.getByRole('alert')).toHaveTextContent('Espera un minuto')
  })

  it('ofrece un skeleton propio', () => {
    const { container } = render(<InterestFormSkeleton />)
    expect(container.firstChild).toHaveClass('interest-form-skeleton')
  })
})
