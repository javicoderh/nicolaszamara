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
    expect(screen.queryByRole('heading', { name: /acompañar los procesos de la vida/i })).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(800))
    expect(screen.getByRole('heading', { name: /acompañar los procesos de la vida/i })).toBeInTheDocument()
  })

  it('quita la barra final en rutas interiores', () => {
    expect(normalizePath('/consulta/')).toBe('/consulta')
    expect(normalizePath('/')).toBe('/')
  })

  it('sirve una ruta interior al acceder directamente', () => {
    window.history.replaceState({}, '', '/consulta')
    render(<App />)
    act(() => vi.advanceTimersByTime(800))
    expect(screen.getByRole('heading', { name: /un espacio para comenzar/i })).toBeInTheDocument()
  })

  it('muestra la página no encontrada para rutas desconocidas', () => {
    window.history.replaceState({}, '', '/ruta-inexistente')
    render(<App />)
    act(() => vi.advanceTimersByTime(800))
    expect(screen.getByRole('heading', { name: /este camino todavía no está en el mapa/i })).toBeInTheDocument()
  })
})
