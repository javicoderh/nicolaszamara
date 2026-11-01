import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import App from './App.jsx'

vi.mock('../pages/AdminPage/AdminPage.jsx', () => ({ default: () => <main id="main-content">Administración simulada</main> }))
afterEach(() => window.history.replaceState({}, '', '/'))
it('routes /admin directly without public assistant, consent UI or page sensors', () => {
  window.history.replaceState({}, '', '/admin')
  render(<App />)
  expect(screen.getByText('Administración simulada')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /abrir asistente/i })).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Cargando inicio')).not.toBeInTheDocument()
  expect(document.querySelector('.analytics-consent-skeleton')).toBeNull()
  expect(document.title).toBe('Administración | Nicolás Zamara')
  expect(document.querySelector('meta[name="robots"]').content).toBe('noindex,nofollow')
})
