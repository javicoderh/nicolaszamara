import { describe, expect, it, vi } from 'vitest'
import { CONSENT_STORAGE_KEY, CONSENT_VERSION, CONSENT_MAX_AGE_MS, UNKNOWN_CONSENT, createConsentStore, parseConsent, clearAnalyticsCookies } from './consentService.js'

const date = Date.parse('2026-10-29T12:00:00Z')
function storage() {
  const values = new Map()
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) }
}

describe('consent service', () => {
  it('defaults to unknown, persists independent preferences and can reject', () => {
    const data = storage()
    const revoke = vi.fn()
    const store = createConsentStore({ storage: data, now: () => date, onRevoke: revoke })
    expect(store.getSnapshot()).toBe(UNKNOWN_CONSENT)
    store.save({ analytics: true, experience: false })
    expect(createConsentStore({ storage: data, now: () => date }).getSnapshot()).toMatchObject({ analytics: true, experience: false, status: 'accepted' })
    store.save({ analytics: false, experience: false })
    expect(store.getSnapshot().status).toBe('rejected')
    expect(revoke).toHaveBeenCalledTimes(1)
    expect(JSON.parse(data.getItem(CONSENT_STORAGE_KEY)).version).toBe(CONSENT_VERSION)
  })
  it('keeps the preference in memory when storage is blocked', () => {
    const data = { getItem: () => { throw Error('blocked') }, setItem: () => { throw Error('blocked') } }
    const store = createConsentStore({ storage: data, now: () => date })
    expect(store.save({ analytics: false, experience: true })).toBe(true)
    expect(store.getSnapshot()).toMatchObject({ experience: true, analytics: false })
    expect(store.save({ analytics: 'true', experience: false })).toBe(false)
  })
  it('treats corrupt, outdated, future and sensitive stored preferences as unknown', () => {
    const store = createConsentStore({ storage: null, now: () => date })
    store.save({ analytics: true, experience: false })
    const valid = store.getSnapshot()
    for (const raw of ['not-json', 'null', JSON.stringify({ ...valid, email: 'a@b.invalid' }),
      JSON.stringify({ ...valid, version: 'old' }), JSON.stringify({ ...valid, status: 'rejected' }),
      JSON.stringify({ ...valid, updatedAt: new Date(date + 1).toISOString() })]) {
      expect(parseConsent(raw, date)).toBe(UNKNOWN_CONSENT)
    }
    expect(parseConsent(JSON.stringify(valid), date + CONSENT_MAX_AGE_MS)).toBe(UNKNOWN_CONSENT)
  })
  it('synchronizes external preference changes and cleans up subscriptions', () => {
    const data = storage()
    const store = createConsentStore({ storage: data, now: () => date })
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    createConsentStore({ storage: data, now: () => date }).save({ analytics: false, experience: false })
    window.dispatchEvent(new StorageEvent('storage', { key: CONSENT_STORAGE_KEY }))
    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot().status).toBe('rejected')
    unsubscribe()
    window.dispatchEvent(new StorageEvent('storage', { key: CONSENT_STORAGE_KEY }))
    expect(listener).toHaveBeenCalledTimes(1)
  })
  it('removes optional cookies without removing the functional chat cookie', () => {
    const writes = []
    const documentRef = { get cookie() { return '_ga=one; _ga_ID=two; _clck=three; chat_identity=four' }, set cookie(value) { writes.push(value) } }
    clearAnalyticsCookies(documentRef, 'www.nicolaszamara.com')
    expect(writes.some((value) => value.startsWith('_ga=; Max-Age=0'))).toBe(true)
    expect(writes.some((value) => value.includes('Domain=nicolaszamara.com'))).toBe(true)
    expect(writes.every((value) => !value.includes('chat_identity'))).toBe(true)
  })
})
