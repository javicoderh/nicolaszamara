import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useAdminQuery } from './useAdminQuery.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

it('waits for the request and then exactly 800 ms; a new key discards an obsolete request', async () => {
  const finish = {}
  const load = vi.fn((signal, key) => new Promise((resolve) => { finish[key] = resolve }))
  const { result, rerender } = renderHook(({ key }) => useAdminQuery(load, key), { initialProps: { key: 'first' } })
  await act(async () => vi.advanceTimersByTimeAsync(1000))
  expect(result.current.pending).toBe(true)
  rerender({ key: 'second' })
  expect(load.mock.calls[0][0].aborted).toBe(true)
  await act(async () => { await Promise.resolve(); finish.first('obsolete'); finish.second('current') })
  await act(async () => vi.advanceTimersByTimeAsync(799))
  expect(result.current.pending).toBe(true)
  await act(async () => vi.advanceTimersByTimeAsync(1))
  expect(result.current.data).toBe('current')
})

it('ends a hung request with delayed error, reloads and cleans up on unmount', async () => {
  const load = vi.fn().mockImplementationOnce(() => new Promise(() => {})).mockResolvedValue('ready')
  const { result, unmount } = renderHook(() => useAdminQuery(load))
  await act(async () => vi.advanceTimersByTimeAsync(15799))
  expect(result.current.pending).toBe(true)
  await act(async () => vi.advanceTimersByTimeAsync(1))
  expect(result.current.error).toBeInstanceOf(Error)
  act(() => result.current.reload())
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(result.current.data).toBe('ready')
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
