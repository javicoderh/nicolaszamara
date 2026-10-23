import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App, { normalizePath } from './App.jsx'
import { chatbotApi } from '../services/chatbotService.js'
import { sessionResult } from '../test/chatbotFixtures.js'

describe('App', () => {
  it('serves /chatbot directly after the page delay without a duplicate floating assistant', async () => {
    const session = vi.spyOn(chatbotApi, 'session').mockResolvedValue(sessionResult())
    window.history.replaceState({}, '', '/chatbot/')
    render(<App />)
    expect(screen.getByLabelText('Cargando conversación')).toHaveAttribute('aria-busy', 'true')
    await act(async () => vi.advanceTimersByTimeAsync(799))
    expect(screen.queryByRole('heading', { name: '¿En qué podemos ayudarte?' })).not.toBeInTheDocument()
    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(screen.getByRole('heading', { name: '¿En qué podemos ayudarte?' })).toBeInTheDocument()
    expect(screen.getAllByRole('region', { name: 'Asistente de servicios' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /abrir asistente/i })).not.toBeInTheDocument()
    expect(document.title).toBe('Conversemos | Nicolás Zamara')
    session.mockRestore()
  })
  beforeEach(() => { vi.useFakeTimers(); vi.spyOn(window, 'scrollTo').mockImplementation(() => {}) })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    window.history.replaceState({}, '', '/')
  })

  it('muestra el skeleton antes de revelar la portada a los 800 ms', () => {
    window.history.replaceState({}, '', '/')
    render(<App />)
    expect(screen.getByLabelText('Cargando inicio')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('heading', { name: /cuidar tu salud también es atender cómo te sientes/i })).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(800))
    expect(screen.getByRole('heading', { name: /cuidar tu salud también es atender cómo te sientes/i })).toBeInTheDocument()
  })

  it('quita la barra final en rutas interiores', () => {
    expect(normalizePath('/consulta/')).toBe('/consulta')
    expect(normalizePath('/')).toBe('/')
  })

  it('preserves the draft across internal routes, the wide view and browser history without refreshing the session', async () => {
    const session = vi.spyOn(chatbotApi, 'session').mockResolvedValue(sessionResult())
    render(<App />)
    expect(document.querySelector('.chatbot-skeleton')).toBeInTheDocument()
    await act(async () => vi.advanceTimersByTimeAsync(800))
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente/i }))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    fireEvent.change(screen.getByLabelText('Escribe tu consulta'), { target: { value: 'Mi consulta sigue aquí' } })
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Explorar servicios' })).getByRole('link', { name: 'Terapias' }))
    expect(window.location.pathname).toBe('/terapias')
    expect(screen.getByRole('dialog').parentElement).toHaveClass('chatbot--closing')
    expect(document.querySelector('.chatbot-skeleton')).not.toBeInTheDocument()
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(document.querySelector('.site-app').closest('[inert]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /abrir asistente/i }))
    expect(screen.getByLabelText('Escribe tu consulta')).toHaveValue('Mi consulta sigue aquí')
    fireEvent.click(screen.getByRole('link', { name: 'Ampliar conversación' }))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(window.location.pathname).toBe('/chatbot')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByLabelText('Escribe tu consulta')).toHaveLength(1)
    expect(screen.getByLabelText('Escribe tu consulta')).toHaveValue('Mi consulta sigue aquí')
    act(() => { window.history.replaceState({}, '', '/terapias'); window.dispatchEvent(new PopStateEvent('popstate')) })
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText('Escribe tu consulta')).toHaveValue('Mi consulta sigue aquí')
    expect(session).toHaveBeenCalledTimes(1)
  })

  it.each(['/', '/consulta', '/terapias', '/cursos', '/privacidad', '/ruta-inexistente'])('presenta %s sin rótulos de sección ni textos de prueba', (path) => {
    window.history.replaceState({}, '', path)
    const { container } = render(<App />)
    act(() => vi.advanceTimersByTime(800))
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(container.querySelector('.eyebrow')).toBeNull()
    expect(container).not.toHaveTextContent(/versión de pruebas|datos ficticios|durante la revisión|pendiente de entrega|un espacio para escuchar, aprender y estar/i)
    expect(container.querySelector('.photo-placeholder figcaption')).toBeNull()
  })

  it('sirve una ruta interior al acceder directamente', () => {
    window.history.replaceState({}, '', '/consulta')
    render(<App />)
    act(() => vi.advanceTimersByTime(800))
    expect(screen.getByRole('heading', { name: /una atención que considera tu motivo/i })).toBeInTheDocument()
  })

  it('muestra la página no encontrada para rutas desconocidas', () => {
    window.history.replaceState({}, '', '/ruta-inexistente')
    render(<App />)
    act(() => vi.advanceTimersByTime(800))
    expect(screen.getByRole('heading', { name: /este camino todavía no está en el mapa/i })).toBeInTheDocument()
  })

  it('abre terapias directamente y respeta los 800 ms antes de mostrar los servicios', () => {
    window.history.replaceState({}, '', '/terapias')
    render(<App />)
    expect(screen.getByLabelText('Cargando terapias')).toHaveAttribute('aria-busy', 'true')
    act(() => vi.advanceTimersByTime(799))
    expect(screen.queryByRole('heading', { level: 1, name: 'Terapias' })).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByRole('heading', { level: 1, name: 'Terapias' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Terapias' })).toHaveAttribute('aria-current', 'page')
    expect(document.title).toBe('Terapias y servicios | Nicolás Zamara')
  })
})
