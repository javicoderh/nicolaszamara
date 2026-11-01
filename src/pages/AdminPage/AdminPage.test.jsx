import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import AdminPage from './AdminPage.jsx'
import AdminPageSkeleton from './AdminPageSkeleton.jsx'
import { AdminError } from '../../services/adminService.js'

vi.mock('../../components/AdminLogin/AdminLogin.jsx', () => ({ default: ({ onAuthenticated, notice }) => <section><p>{notice}</p><button onClick={() => onAuthenticated('unit')}>Acceso simulado</button></section> }))
vi.mock('../../components/AdminDashboard/AdminDashboard.jsx', () => ({ default: ({ onPasswordChanged, onExpired }) => <section><p>Panel simulado</p><button onClick={onPasswordChanged}>Cambio simulado</button><button onClick={onExpired}>Expiración simulada</button></section> }))
beforeEach(() => vi.useFakeTimers())
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
it('renders the session skeleton immediately', () => {
  render(<AdminPageSkeleton />)
  expect(screen.getByLabelText('Cargando administración')).toHaveAttribute('aria-busy', 'true')
})
it('requires a session, accepts login and returns to login after a password change', async () => {
  render(<AdminPage loadSession={vi.fn().mockRejectedValue(new AdminError('unauthorized'))} />)
  expect(screen.getByLabelText('Cargando administración')).toBeInTheDocument()
  await act(async () => vi.advanceTimersByTimeAsync(799))
  expect(screen.queryByText('Acceso simulado')).not.toBeInTheDocument()
  await act(async () => vi.advanceTimersByTimeAsync(1))
  fireEvent.click(screen.getByText('Acceso simulado'))
  expect(screen.getByText('Panel simulado')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Cambio simulado'))
  expect(screen.getByText(/Contraseña actualizada/)).toBeInTheDocument()
  expect(screen.queryByText('Panel simulado')).not.toBeInTheDocument()
})
it('logs out remotely before hiding protected data', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'signed_out' }) }))
  render(<AdminPage loadSession={vi.fn().mockResolvedValue({ username: 'unit' })} />)
  await act(async () => vi.advanceTimersByTimeAsync(800))
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
  expect(screen.getByLabelText('Cerrando sesión')).toBeInTheDocument()
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(screen.getByText('Sesión cerrada.')).toBeInTheDocument()
  expect(screen.queryByText('Panel simulado')).not.toBeInTheDocument()
})
it('distinguishes an unavailable server from a signed-out user and permits retry', async () => {
  const loadSession = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue({ username: 'unit' })
  render(<AdminPage loadSession={loadSession} />)
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(screen.getByRole('alert')).toHaveTextContent('No pudimos')
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar acceso' }))
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(screen.getByText('Panel simulado')).toBeInTheDocument()
})
