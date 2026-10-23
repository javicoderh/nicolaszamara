import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ChatFeedback from './ChatFeedback.jsx'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function fill() {
  fireEvent.click(screen.getByRole('button', { name: 'Sugerir una mejor respuesta' }))
  fireEvent.change(screen.getByLabelText('Pregunta o caso que faltó *'), { target: { value: '¿En qué consiste el método floral Bach?' } })
  fireEvent.change(screen.getByLabelText('Respuesta que propones *'), { target: { value: 'Explicar el método y preguntar si le interesa aprender o conocerlo para sí.' } })
}

it('requires explicit consent and reveals success only after request completion plus 800 ms', async () => {
  let resolve
  const submit = vi.fn(() => new Promise((done) => { resolve = done }))
  render(<ChatFeedback requestId="request-1" conversationId="conversation-1" submit={submit} />)
  fill()
  expect(screen.getByRole('button', { name: 'Guardar propuesta' })).toBeDisabled()
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: 'Guardar propuesta' }))
  expect(screen.getByRole('status', { name: 'Guardando propuesta' })).toBeInTheDocument()
  await act(async () => vi.advanceTimersByTimeAsync(2500))
  expect(screen.queryByText(/propuesta guardada para revisión/i)).not.toBeInTheDocument()
  await act(async () => resolve({ status: 'saved' }))
  await act(async () => vi.advanceTimersByTimeAsync(799))
  expect(screen.queryByText(/propuesta guardada para revisión/i)).not.toBeInTheDocument()
  await act(async () => vi.advanceTimersByTimeAsync(1))
  expect(screen.getByText(/se incorporará solo después de aprobarla/i)).toBeInTheDocument()
  expect(submit).toHaveBeenCalledTimes(1)
  expect(submit.mock.calls[0][0]).toMatchObject({ consent: true, request_id: 'request-1', conversation_id: 'conversation-1' })
  expect(submit.mock.calls[0][0]).not.toHaveProperty('messages')
})

it('preserves fields and the request identity after an uncertain save', async () => {
  const submit = vi.fn().mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue({ status: 'saved' })
  render(<ChatFeedback requestId="request-1" conversationId="conversation-1" submit={submit} />)
  fill(); fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: 'Guardar propuesta' }))
  await act(async () => vi.advanceTimersByTimeAsync(799))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  await act(async () => vi.advanceTimersByTimeAsync(1))
  expect(screen.getByRole('alert')).toHaveTextContent(/conservamos tu propuesta/i)
  expect(screen.getByLabelText('Pregunta o caso que faltó *')).toHaveValue('¿En qué consiste el método floral Bach?')
  fireEvent.click(screen.getByRole('button', { name: 'Guardar propuesta' }))
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(submit.mock.calls[0][0].id).toBe(submit.mock.calls[1][0].id)
})
