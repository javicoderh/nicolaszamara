import { StrictMode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ChatbotProvider } from './ChatbotContext.jsx'
import Chatbot from '../../components/Chatbot/Chatbot.jsx'
import { mockChatApi } from '../../test/chatbotFixtures.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

it('shares replies and the pending operation when switching views, but resets on a real remount', async () => {
  const api = mockChatApi()
  const view = (embedded) => <ChatbotProvider api={api}><Chatbot key={String(embedded)} embedded={embedded} /></ChatbotProvider>
  const { rerender, unmount } = render(view(false))
  fireEvent.click(screen.getByRole('button', { name: /abrir asistente/i }))
  await act(async () => vi.advanceTimersByTimeAsync(800))
  fireEvent.change(screen.getByLabelText('Escribe tu consulta'), { target: { value: 'Curso' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  rerender(view(true))
  expect(screen.getByRole('status', { name: 'Preparando orientación' })).toBeInTheDocument()
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(screen.getByText('Aquí tienes el curso.')).toBeInTheDocument()
  expect(api.session).toHaveBeenCalledTimes(1)
  expect(api.send).toHaveBeenCalledTimes(1)
  unmount()
  render(view(true))
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(screen.queryByText('Aquí tienes el curso.')).not.toBeInTheDocument()
  expect(api.session).toHaveBeenCalledTimes(2)
  expect(api.session).toHaveBeenLastCalledWith(expect.objectContaining({ fresh: true }))
})

it('finishes initial loading in StrictMode after cleanup and retries the interrupted task', async () => {
  const api = mockChatApi()
  render(<StrictMode><ChatbotProvider api={api}><Chatbot embedded /></ChatbotProvider></StrictMode>)
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(screen.queryByRole('status', { name: 'Preparando orientación' })).not.toBeInTheDocument()
  expect(screen.getByLabelText('Escribe tu consulta')).toBeEnabled()
})
