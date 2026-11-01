import { act } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); window.history.replaceState({}, '', '/') })
describe('App hydration contract', () => {
  it('hydrates a nature page without duplicated content or recoverable mismatches', async () => {
    vi.useFakeTimers()
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    window.history.replaceState({}, '', '/naturaleza')
    const container = document.createElement('div')
    container.innerHTML = renderToString(<App initialPath="/naturaleza" />)
    document.body.appendChild(container)
    const errors = []
    let root
    try {
      await act(async () => { root = hydrateRoot(container, <App />, { onRecoverableError: (error) => errors.push(error) }) })
      expect(container.querySelector('.site-app__page-content')).toHaveAttribute('aria-hidden', 'true')
      await act(async () => vi.advanceTimersByTimeAsync(799))
      expect(container.querySelector('.site-app__loading-skeleton')).toBeInTheDocument()
      await act(async () => vi.advanceTimersByTimeAsync(1))
      expect(container.querySelector('.site-app__loading-skeleton')).toBeNull()
      expect(container.querySelectorAll('#main-content')).toHaveLength(1)
      expect(container.querySelector('[data-analytics-section="nature_page_form"]')).toBeInTheDocument()
      expect(container.querySelector('fieldset')).not.toBeDisabled()
      expect(errors).toEqual([])
    } finally {
      if (root) await act(async () => root.unmount())
      container.remove()
    }
  })
})
