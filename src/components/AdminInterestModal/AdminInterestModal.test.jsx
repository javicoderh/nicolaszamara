import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import AdminInterestModal from './AdminInterestModal.jsx'
import AdminInterestModalSkeleton from './AdminInterestModalSkeleton.jsx'

beforeEach(() => {
  vi.useFakeTimers()
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})
afterEach(() => vi.useRealTimers())
it('reserves detail space immediately', () => {
  render(<AdminInterestModalSkeleton />)
  expect(screen.getByLabelText('Cargando detalle')).toHaveAttribute('aria-busy', 'true')
})
it('loads one record, reveals after 800 ms and supports close and focus restoration', async () => {
  const close = vi.fn(), load = vi.fn().mockResolvedValue({ record: { id: 'unit', full_name: 'Persona de prueba', email: 'unit@example.invalid', interest: 'nature', created_at: '2026-11-01T12:00:00Z', updates_consent: false, privacy_consent: true } })
  const trigger = document.createElement('button')
  document.body.append(trigger); trigger.focus()
  const { unmount } = render(<AdminInterestModal id="unit" onClose={close} onExpired={vi.fn()} load={load} />)
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByLabelText('Cargando detalle')).toBeInTheDocument()
  await act(async () => vi.advanceTimersByTimeAsync(799))
  expect(screen.queryByText('unit@example.invalid')).not.toBeInTheDocument()
  await act(async () => vi.advanceTimersByTimeAsync(1))
  expect(screen.getByText('unit@example.invalid')).toBeInTheDocument()
  expect(screen.getByText('Persona de prueba')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar detalle' }))
  expect(close).toHaveBeenCalledOnce()
  unmount()
  expect(document.activeElement).toBe(trigger)
  expect(document.body.style.overflow).toBe('')
  trigger.remove()
})
it('offers retry after a remote failure and handles Escape through native cancel', async () => {
  const load = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue({ record: { id: 'unit', full_name: 'Recuperado' } }), close = vi.fn()
  render(<AdminInterestModal id="unit" load={load} onClose={close} onExpired={vi.fn()} />)
  await act(async () => vi.advanceTimersByTimeAsync(800))
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar detalle' }))
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(screen.getByText('Recuperado')).toBeInTheDocument()
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: false, cancelable: true }))
  expect(close).toHaveBeenCalledOnce()
})
it('marks a reviewed interest only on request and reveals success after response plus 800 ms', async () => {
  let finish
  const markRead = vi.fn(() => new Promise((resolve) => { finish = resolve })), onRead = vi.fn()
  render(<AdminInterestModal id="unit" onClose={vi.fn()} onExpired={vi.fn()} onRead={onRead} markRead={markRead}
    load={vi.fn().mockResolvedValue({ record: { id: 'unit', full_name: 'Persona de prueba', read_at: null } })} />)
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(markRead).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Marcar como leído' }))
  expect(screen.getByLabelText('Guardando lectura')).toHaveAttribute('aria-busy', 'true')
  expect(screen.getByRole('button', { name: 'Marcar como leído' })).toBeDisabled()
  await act(async () => { await Promise.resolve(); finish({ status: 'ready', read_at: '2026-11-01T12:00:00Z' }) })
  await act(async () => vi.advanceTimersByTimeAsync(799))
  expect(onRead).not.toHaveBeenCalled()
  await act(async () => vi.advanceTimersByTimeAsync(1))
  expect(onRead).toHaveBeenCalledOnce()
  expect(screen.getByRole('button', { name: 'Leído' })).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('Interés marcado como leído')
})
it('keeps a failed write unread and allows retry; an existing read cannot be marked twice', async () => {
  const markRead = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue({ status: 'ready', read_at: '2026-11-01T12:00:00Z' }), onRead = vi.fn()
  const { unmount } = render(<AdminInterestModal id="unit" onClose={vi.fn()} onExpired={vi.fn()} onRead={onRead} markRead={markRead}
    load={vi.fn().mockResolvedValue({ record: { id: 'unit', full_name: 'Persona de prueba' } })} />)
  await act(async () => vi.advanceTimersByTimeAsync(800))
  fireEvent.click(screen.getByRole('button', { name: 'Marcar como leído' }))
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(screen.getByRole('alert')).toHaveTextContent('No pudimos')
  expect(onRead).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Marcar como leído' }))
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(onRead).toHaveBeenCalledOnce()
  unmount()
  render(<AdminInterestModal id="unit" onClose={vi.fn()} onExpired={vi.fn()} markRead={markRead}
    load={vi.fn().mockResolvedValue({ record: { id: 'unit', read_at: '2026-11-01T12:00:00Z' } })} />)
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(screen.getByRole('button', { name: 'Leído' })).toBeDisabled()
  expect(markRead).toHaveBeenCalledTimes(2)
})
