import { describe, expect, it, vi } from 'vitest'
import { createMarketingTracker } from './marketingTracker.js'
import { createPageContext } from './analyticsPageContext.js'

const params = { placement: 'floating_contact' }
describe('marketing tracker', () => {
  it('rejects preconsent and invalid data without dispatch or transport', () => {
    const send = vi.fn(), dispatch = vi.fn()
    const tracker = createMarketingTracker({ allowed: () => false, adapter: { send }, page: () => createPageContext('/'), dispatch })
    expect(tracker.track('chatbot_open', params)).toBe(false)
    expect(send).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
  })
  it('caps queued events, expires old entries and survives adapter failure', async () => {
    let resolve, time = 0
    const send = vi.fn().mockImplementationOnce(() => new Promise((done) => { resolve = done })).mockResolvedValue(true)
    const tracker = createMarketingTracker({ allowed: () => true, adapter: { send }, page: () => createPageContext('/'), now: () => time })
    tracker.track('chatbot_open', params)
    for (let i = 0; i < 60; i++) tracker.track('chatbot_open', params)
    resolve(true)
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(51))
    let release
    send.mockImplementationOnce(() => new Promise((done) => { release = done }))
    tracker.track('chatbot_open', params)
    tracker.track('chatbot_open', params)
    time = 30000
    release(true)
    await Promise.resolve(); await Promise.resolve()
    expect(send).toHaveBeenCalledTimes(52)
  })
  it('clears queued actions on revocation and never replays them on a later grant', async () => {
    let resolve
    const send = vi.fn(() => new Promise((done) => { resolve = done })), stop = vi.fn()
    const tracker = createMarketingTracker({ allowed: () => true, adapter: { send, stop }, page: () => createPageContext('/') })
    tracker.track('chatbot_open', params)
    tracker.track('chatbot_open', params)
    tracker.revoke()
    resolve(true)
    await Promise.resolve(); await Promise.resolve()
    expect(send).toHaveBeenCalledOnce()
    expect(stop).toHaveBeenCalledOnce()
  })
})
