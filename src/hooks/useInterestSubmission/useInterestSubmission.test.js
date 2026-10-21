import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useInterestSubmission } from './useInterestSubmission.js'

describe('useInterestSubmission', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('espera la respuesta real y luego los 800 ms adicionales', async () => {
    let finish
    const service = vi.fn(() => new Promise((resolve) => { finish = resolve }))
    const { result } = renderHook(() => useInterestSubmission(service))
    act(() => { void result.current.submit({ interest: 'nature' }) })
    await act(async () => { await vi.advanceTimersByTimeAsync(1200) })
    expect(result.current.status).toBe('submitting')
    await act(async () => { finish({ status: 'saved' }); await Promise.resolve() })
    await act(async () => { await vi.advanceTimersByTimeAsync(799) })
    expect(result.current.status).toBe('submitting')
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    expect(result.current.status).toBe('saved')
  })

  it('cancela al desmontar y descarta respuestas tardías', async () => {
    let finish
    const service = vi.fn(() => new Promise((resolve) => { finish = resolve }))
    const { result, unmount } = renderHook(() => useInterestSubmission(service))
    act(() => { void result.current.submit({ interest: 'online' }) })
    const signal = service.mock.calls[0][1].signal
    unmount()
    expect(signal.aborted).toBe(true)
    finish({ status: 'saved' })
    await Promise.resolve()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('limpia el temporizador de revelado al desmontar', async () => {
    const { result, unmount } = renderHook(() => useInterestSubmission(vi.fn().mockResolvedValue({ status: 'saved' })))
    await act(async () => { await result.current.submit({ interest: 'online' }) })
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
