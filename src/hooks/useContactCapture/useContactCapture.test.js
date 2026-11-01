import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useContactCapture } from './useContactCapture.js'
import { createFormMetrics } from '../../services/formMetrics.js'
vi.mock('../../services/analyticsPermission.js', () => ({ analyticsAllowed: () => true }))

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())
describe('useContactCapture', () => {
  it('blocks simultaneous submissions and emits no personal data after confirmed saving', async () => {
    const submit = vi.fn().mockResolvedValue({ status: 'saved' }), onSaved = vi.fn(), listener = vi.fn()
    window.addEventListener('nzamara:metric', listener)
    const metrics = createFormMetrics({ kind: 'chat_contact', placement: 'floating_chat_form', source: 'chatbot', service: () => 'general' })
    const { result } = renderHook(() => useContactCapture(submit, onSaved, metrics))
    act(() => { result.current.save({ values: { name: 'Ana' } }); result.current.save({ values: { name: 'Ana' } }) })
    await act(async () => vi.advanceTimersByTimeAsync(800))
    expect(submit).toHaveBeenCalledTimes(1)
    expect(onSaved).toHaveBeenCalledOnce()
    expect(listener.mock.calls.at(-1)[0].detail).toEqual({ eventName: 'generate_lead', params: { form_kind: 'chat_contact', placement: 'floating_chat_form', service: 'general', lead_source: 'chatbot' } })
    window.removeEventListener('nzamara:metric', listener)
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
