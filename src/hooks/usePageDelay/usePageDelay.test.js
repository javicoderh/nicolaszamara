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
})
