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
  expect(result.current).toMatchObject({ pathname: '/cursos', hash: '#interes-online', search: '' })
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
it('opens a reloaded article as a standalone page even when history retained modal state',()=>{
 window.history.replaceState({blogBackground:'/blog?category=naturaleza',blogDepth:2,scroll:600,other:'preserved'},'','/blog/un-bosque')
 const {result}=renderHook(()=>useSiteNavigation(paths))
 expect(result.current.state).toEqual({other:'preserved'});expect(window.history.state.blogBackground).toBeUndefined()
})
it('preserves background state on subsequent back and forward navigation',()=>{
 const {result}=renderHook(()=>useSiteNavigation(paths))
 act(()=>{window.history.pushState({blogBackground:'/blog',blogDepth:1},'','/blog/un-bosque');window.dispatchEvent(new PopStateEvent('popstate'))})
 expect(result.current.state.blogBackground).toBe('/blog')
})
