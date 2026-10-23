import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useChatbotViewport } from './useChatbotViewport.js'

afterEach(() => vi.unstubAllGlobals())

it('tracks the keyboard viewport and cleans up listeners and dynamic styles', () => {
  const viewport = Object.assign(new EventTarget(), { height: 700, offsetTop: 0 })
  vi.stubGlobal('visualViewport', viewport)
  vi.stubGlobal('innerHeight', 800)
  const ref = { current: document.createElement('div') }
  const { rerender } = renderHook(({ active }) => useChatbotViewport(ref, active), { initialProps: { active: true } })
  expect(ref.current.style.getPropertyValue('--chat-viewport-height')).toBe('700px')
  act(() => { viewport.height = 430; viewport.offsetTop = 20; viewport.dispatchEvent(new Event('resize')) })
  expect(ref.current.style.getPropertyValue('--chat-viewport-bottom')).toBe('350px')
  expect(ref.current).toHaveAttribute('data-compact')
  rerender({ active: false })
  viewport.dispatchEvent(new Event('scroll'))
  expect(ref.current.style.getPropertyValue('--chat-viewport-height')).toBe('')
  expect(ref.current).not.toHaveAttribute('data-compact')
})

it('uses the CSS fallback when the browser has no visual viewport API', () => {
  vi.stubGlobal('visualViewport', undefined)
  const ref = { current: document.createElement('div') }
  renderHook(() => useChatbotViewport(ref, true))
  expect(ref.current.style.length).toBe(0)
})
