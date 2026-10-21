import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import InterestForm from './InterestForm.jsx'
import InterestFormSkeleton from './InterestFormSkeleton.jsx'

describe('InterestForm', () => {
  it('no marca el consentimiento y no presenta éxito si el servicio no está disponible', async () => {
    const submitInterest = vi.fn().mockResolvedValue({ status: 'unavailable' })
    render(<InterestForm kind="nature" submitInterest={submitInterest} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Santiago' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar mi interés' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se enviaron tus datos')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(submitInterest).toHaveBeenCalledWith(expect.objectContaining({ interest: 'nature', updatesConsent: false }))
  })

  it('permite confirmar solo el resultado de guardado devuelto por el servicio', async () => {
    const submitInterest = vi.fn().mockResolvedValue({ status: 'saved' })
    render(<InterestForm kind="online" submitInterest={submitInterest} />)
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByLabelText(/país/i), { target: { value: 'Chile' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar mi interés' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Tu interés quedó registrado')
  })

  it('muestra error recuperable si el servicio rechaza la solicitud', async () => {
    const submitInterest = vi.fn().mockRejectedValue(new Error('offline'))
    render(<InterestForm kind="nature" submitInterest={submitInterest} />)
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Santiago' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar mi interés' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar mi interés' })).toBeEnabled()
  })

  it('ofrece un skeleton propio', () => {
    const { container } = render(<InterestFormSkeleton />)
    expect(container.firstChild).toHaveClass('interest-form-skeleton')
  })
})
