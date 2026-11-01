import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import AdminLogin from './AdminLogin.jsx'
import AdminLoginSkeleton from './AdminLoginSkeleton.jsx'
import { AdminError } from '../../services/adminService.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())
it('shows its skeleton immediately', () => {
  render(<AdminLoginSkeleton />)
  expect(screen.getByRole('status', { name: 'Validando acceso' })).toHaveAttribute('aria-busy', 'true')
})
it('submits credentials once and reveals authentication only after request + delay', async () => {
  let finish
  const request = vi.fn(() => new Promise((resolve) => { finish = resolve }))
  const authenticated = vi.fn()
  render(<AdminLogin request={request} onAuthenticated={authenticated} />)
  fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'unit' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'unit-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
  expect(screen.getByLabelText('Validando acceso')).toBeInTheDocument()
  expect(screen.getByLabelText('Contraseña')).toBeDisabled()
  await act(async () => { await Promise.resolve(); finish({ username: 'unit' }) })
  await act(async () => vi.advanceTimersByTimeAsync(799))
  expect(authenticated).not.toHaveBeenCalled()
  await act(async () => vi.advanceTimersByTimeAsync(1))
  expect(authenticated).toHaveBeenCalledWith('unit')
  expect(request).toHaveBeenCalledTimes(1)
})
it('keeps fields for retry and shows a delayed authentication error', async () => {
  render(<AdminLogin onAuthenticated={vi.fn()} request={vi.fn().mockRejectedValue(new AdminError('invalid_credentials'))} />)
  fireEvent.change(screen.getByLabelText('Usuario'), { target: { value: 'unit' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'wrong' } })
  fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(screen.getByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos')
  expect(screen.getByLabelText('Usuario')).toHaveValue('unit')
})
