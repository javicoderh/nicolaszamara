import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useFormMetrics } from './useFormMetrics.js'
import { trackEvent } from '../../services/analyticsService.js'
vi.mock('../../services/analyticsService.js', () => ({ trackEvent: vi.fn(() => true) }))

describe('useFormMetrics', () => {
  it('keeps one logical attempt across renders but uses the latest selected service', () => {
    const { result, rerender } = renderHook(({ service }) => useFormMetrics({ kind: 'chat_contact', placement: 'embedded_chat_form', source: 'chatbot', service }), { initialProps: { service: 'online' } })
    result.current.start()
    rerender({ service: 'nature' })
    result.current.start()
    result.current.success()
    expect(trackEvent).toHaveBeenCalledTimes(2)
    expect(trackEvent).toHaveBeenLastCalledWith('generate_lead', { form_kind: 'chat_contact', placement: 'embedded_chat_form', service: 'nature', lead_source: 'chatbot' })
  })
})
