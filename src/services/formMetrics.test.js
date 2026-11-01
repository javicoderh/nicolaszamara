import { describe, expect, it, vi } from 'vitest'
import { createFormMetrics } from './formMetrics.js'

describe('form metrics', () => {
  it('counts a start and success once, differentiates retries and resets for another interest', () => {
    const emit = vi.fn(() => true)
    const value = createFormMetrics({ kind: 'nature', placement: 'home_nature_form', emit })
    value.start(); value.start(); value.attempt(); value.attempt()
    value.error('rate_limited'); value.attempt(); value.success(); value.success()
    expect(emit.mock.calls.map(([name]) => name)).toEqual(['form_start', 'form_submit_attempt', 'form_submit_error', 'form_retry', 'generate_lead'])
    expect(emit.mock.calls.at(-1)[1]).toEqual({ form_kind: 'nature', placement: 'home_nature_form', service: 'nature', lead_source: 'form' })
    value.reset(); value.attempt(); value.success()
    expect(emit.mock.calls.filter(([name]) => name === 'generate_lead')).toHaveLength(2)
  })
  it('reports closed validation codes and never reads or sends field values', () => {
    const emit = vi.fn(() => true)
    const value = createFormMetrics({ kind: 'online', placement: 'courses_online_form', emit })
    const target = { name: 'email', validity: { valueMissing: true }, get value() { throw Error('must not read') } }
    value.invalid(target); value.invalid(target)
    expect(emit).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalledWith('form_validation_error', { form_kind: 'online', placement: 'courses_online_form', field_id: 'email', error_code: 'required' })
  })
})
