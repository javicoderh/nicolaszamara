import { act, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useSiteNavigation } from './useSiteNavigation.js'

const paths = ['/', '/cursos', '/chatbot']
afterEach(() => { window.history.replaceState({}, '', '/'); vi.restoreAllMocks() })

function click(href, props = {}, event = {}) {
  const anchor = Object.assign(document.createElement('a'), { href, ...props })
  document.body.append(anchor)
  const navigated = !fireEvent.click(anchor, event)
  anchor.remove()
  return navigated
}

it('navigates internal routes and anchors and synchronizes back/forward', () => {
  const { result } = renderHook(() => useSiteNavigation(paths))
  act(() => { expect(click('/cursos#interes-online')).toBe(true) })
  expect(result.current).toEqual({ pathname: '/cursos', hash: '#interes-online' })
  act(() => { window.history.replaceState({}, '', '/chatbot'); window.dispatchEvent(new PopStateEvent('popstate')) })
  expect(result.current.pathname).toBe('/chatbot')
})

it('leaves modified clicks, external URLs, downloads and other targets to the browser', () => {
  // Cancel native jsdom navigation only after our handler has had a chance to run.
  const decisions = []
  renderHook(() => useSiteNavigation(paths))
  const cancel = (event) => { decisions.push(event.defaultPrevented); event.preventDefault() }
  document.addEventListener('click', cancel)
  try {
    click('/cursos', {}, { ctrlKey: true })
    click('/cursos', {}, { metaKey: true })
    click('/cursos', { target: '_blank' })
    click('/cursos', { download: 'file' })
    click('https://example.com/cursos')
    click('/api/chat')
    click('#main-content')
    expect(decisions).toEqual(Array(7).fill(false))
    expect(window.location.pathname).toBe('/')
  } finally { document.removeEventListener('click', cancel) }
})

it('removes global handlers when unmounted', () => {
  const remove = vi.spyOn(document, 'removeEventListener')
  const { unmount } = renderHook(() => useSiteNavigation(paths))
  unmount()
  expect(remove).toHaveBeenCalledWith('click', expect.any(Function))
})
