import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BASE_DELAY_MS, usePageDelay } from './usePageDelay.js'

describe('usePageDelay', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('habilita el contenido después del delay base', () => {
    const { result } = renderHook(() => usePageDelay('home'))
    expect(result.current).toBe(false)
    act(() => vi.advanceTimersByTime(BASE_DELAY_MS))
    expect(result.current).toBe(true)
  })

  it('limpia el temporizador al desmontar', () => {
    const { unmount } = renderHook(() => usePageDelay('home'))
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('never reveals a newly selected route before its own delay', () => {
    const { result, rerender } = renderHook(({ path }) => usePageDelay(path), { initialProps: { path: '/' } })
    act(() => vi.advanceTimersByTime(800))
    expect(result.current).toBe(true)
    rerender({ path: '/cursos' })
    expect(result.current).toBe(false)
    act(() => vi.advanceTimersByTime(799))
    expect(result.current).toBe(false)
    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe(true)
  })
  it('starts another delay on a quick return to a previously ready route', () => {
    const { result, rerender } = renderHook(({ path }) => usePageDelay(path), { initialProps: { path: '/' } })
    act(() => vi.advanceTimersByTime(800))
    rerender({ path: '/cursos' })
    act(() => vi.advanceTimersByTime(100))
    rerender({ path: '/' })
    expect(result.current).toBe(false)
    act(() => vi.advanceTimersByTime(800))
    expect(result.current).toBe(true)
  })
})
