import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDelayedOperation } from './useDelayedOperation.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())
describe('useDelayedOperation', () => {
  it('blocks synchronous duplicate work and delays both outcomes', async () => {
    const work = vi.fn().mockRejectedValue(new Error('failure')), settle = vi.fn()
    const { result } = renderHook(() => useDelayedOperation())
    act(() => { expect(result.current.run(work, settle)).toBe(true); expect(result.current.run(work, settle)).toBe(false) })
    await act(async () => vi.advanceTimersByTimeAsync(799))
    expect(settle).not.toHaveBeenCalled()
    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(settle).toHaveBeenCalledWith({ error: expect.any(Error) })
    expect(work).toHaveBeenCalledTimes(1)
    expect(result.current.pending).toBe(false)
  })
  it('has a deadline even if the adapter ignores abort', async () => {
    const settle = vi.fn()
    const { result } = renderHook(() => useDelayedOperation(1000))
    act(() => result.current.run(() => new Promise(() => {}), settle))
    await act(async () => vi.advanceTimersByTimeAsync(1799))
    expect(settle).not.toHaveBeenCalled()
    await act(async () => vi.advanceTimersByTimeAsync(1))
    expect(settle).toHaveBeenCalledWith({ error: expect.objectContaining({ message: 'request_timeout' }) })
  })
  it('aborts and discards late results without scheduling a new timer', async () => {
    let resolve, signal
    const settle = vi.fn()
    const { result, unmount } = renderHook(() => useDelayedOperation())
    act(() => result.current.run((value) => { signal = value; return new Promise((done) => { resolve = done }) }, settle))
    await act(async () => Promise.resolve())
    unmount()
    expect(signal.aborted).toBe(true)
    await act(async () => resolve('late'))
    expect(vi.getTimerCount()).toBe(0)
    expect(settle).not.toHaveBeenCalled()
  })
})
