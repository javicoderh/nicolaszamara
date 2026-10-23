import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MODAL_FADE_MS, useModalPresence } from './useModalPresence.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

it('retains the modal until its exit ends and cancels stale closing timers on reopen', () => {
  const { result, rerender } = renderHook(({ open }) => useModalPresence(open), { initialProps: { open: false } })
  expect(result.current.present).toBe(false)
  rerender({ open: true })
  expect(result.current.present).toBe(true)
  rerender({ open: false })
  expect(result.current.exiting).toBe(true)
  act(() => vi.advanceTimersByTime(MODAL_FADE_MS - 1))
  expect(result.current.present).toBe(true)
  rerender({ open: true })
  act(() => vi.advanceTimersByTime(MODAL_FADE_MS))
  expect(result.current.present).toBe(true)
  expect(result.current.exiting).toBe(false)
  rerender({ open: false })
  act(() => vi.advanceTimersByTime(MODAL_FADE_MS))
  expect(result.current.present).toBe(false)
})

it('accepts only its own exit animation and releases immediately when disabled', () => {
  const { result, rerender, unmount } = renderHook(({ open, enabled }) => useModalPresence(open, enabled), { initialProps: { open: true, enabled: true } })
  rerender({ open: false, enabled: true })
  const panel = {}, child = {}
  act(() => result.current.finishExit({ target: child, currentTarget: panel, animationName: 'chat-exit' }))
  expect(result.current.present).toBe(true)
  act(() => result.current.finishExit({ target: panel, currentTarget: panel, animationName: 'chat-exit' }))
  expect(result.current.present).toBe(false)
  rerender({ open: true, enabled: true })
  rerender({ open: true, enabled: false })
  expect(result.current.present).toBe(false)
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
