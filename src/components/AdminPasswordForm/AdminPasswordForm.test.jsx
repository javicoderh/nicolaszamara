import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import AdminPasswordForm from './AdminPasswordForm.jsx'
import AdminPasswordFormSkeleton from './AdminPasswordFormSkeleton.jsx'
import { AdminError } from '../../services/adminService.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())
function fill() {
  fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'old-password' } })
  fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'a-new-password' } })
  fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'a-new-password' } })
}
it('renders a pending skeleton without its own delay', () => {
  render(<AdminPasswordFormSkeleton />)
  expect(screen.getByLabelText('Guardando contraseña')).toHaveAttribute('aria-busy', 'true')
})
it('requires matching passwords, then reports change after the remote delay', async () => {
  const request = vi.fn().mockResolvedValue({ status: 'password_changed' }), changed = vi.fn()
  render(<AdminPasswordForm request={request} onChanged={changed} onExpired={vi.fn()} />)
  fill()
  fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'different-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))
  expect(screen.getByRole('alert')).toHaveTextContent('no coinciden')
  expect(request).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: 'a-new-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))
  expect(screen.getByLabelText('Guardando contraseña')).toBeInTheDocument()
  await act(async () => vi.advanceTimersByTimeAsync(799))
  expect(changed).not.toHaveBeenCalled()
  await act(async () => vi.advanceTimersByTimeAsync(1))
  expect(changed).toHaveBeenCalledOnce()
})
it('returns an expired session to the login flow', async () => {
  const expired = vi.fn()
  render(<AdminPasswordForm request={vi.fn().mockRejectedValue(new AdminError('unauthorized'))} onChanged={vi.fn()} onExpired={expired} />)
  fill()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(expired).toHaveBeenCalledOnce()
})
