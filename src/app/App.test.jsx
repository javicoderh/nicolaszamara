import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App, { normalizePath } from './App.jsx'

describe('App', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
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
