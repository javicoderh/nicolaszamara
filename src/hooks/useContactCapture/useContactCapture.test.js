import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useContactCapture } from './useContactCapture.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())
describe('useContactCapture', () => {
  it('blocks simultaneous submissions and emits no personal data after confirmed saving', async () => {
    const submit = vi.fn().mockResolvedValue({ status: 'saved' }), onSaved = vi.fn(), listener = vi.fn()
    window.addEventListener('nzamara:metric', listener, { once: true })
    const { result } = renderHook(() => useContactCapture(submit, onSaved))
    act(() => { result.current.save({ values: { name: 'Ana' } }); result.current.save({ values: { name: 'Ana' } }) })
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(submit).toHaveBeenCalledTimes(1)
    expect(onSaved).toHaveBeenCalledOnce()
    expect(listener.mock.calls[0][0].detail).toEqual({ eventName: 'chat_contact_saved' })
  })
  it('ends a hung save with a delayed failure and keeps the same ID for transport retry', async () => {
    const submit = vi.fn().mockImplementationOnce(() => new Promise(() => {})).mockResolvedValue({ status: 'saved' })
    const { result } = renderHook(() => useContactCapture(submit, vi.fn()))
    act(() => result.current.save({ interest: 'course' }))
    await act(async () => vi.advanceTimersByTimeAsync(15800))
    expect(result.current.status).toBe('unavailable')
    act(() => result.current.save({ interest: 'course' }))
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(submit.mock.calls[0][0].request_id).toBe(submit.mock.calls[1][0].request_id)
  })
})
