import { describe, expect, it, vi } from 'vitest'
import { ATTRIBUTION_STORAGE_KEY, SESSION_IDLE_MS, createCampaignAttribution } from './campaignAttribution.js'

const campaign = { utm_id: 'test-1', utm_source: 'test', utm_medium: 'fixture', utm_campaign: 'test', utm_content: 'hero' }
const id = '00000000-0000-4000-8000-000000000001'
function data() {
  const map = new Map()
  return { getItem: (key) => map.get(key) || null, setItem: vi.fn((key, value) => map.set(key, value)), removeItem: vi.fn((key) => map.delete(key)) }
}
describe('campaign attribution', () => {
  it('creates no identifier or stored session before consent', () => {
    const storage = data(), uuid = vi.fn(() => id)
    const value = createCampaignAttribution({ allowed: () => false, storage, uuid })
    expect(value.touch({ search: '?utm_source=private' })).toBeNull()
    expect(uuid).not.toHaveBeenCalled()
    expect(storage.setItem).not.toHaveBeenCalled()
  })
  it('preserves an approved entry campaign through internal and direct navigation', () => {
    const storage = data()
    const value = createCampaignAttribution({ allowed: () => true, storage, uuid: () => id, campaigns: [campaign] })
    expect(value.touch({ search: new URLSearchParams(campaign).toString() }).campaign).toEqual(campaign)
    expect(value.touch().campaign).toEqual(campaign)
    expect(createCampaignAttribution({ allowed: () => true, storage, campaigns: [campaign] }).touch().session_id).toBe(id)
  })
  it('expires inactivity and starts a new session without restoring an old campaign', () => {
    let time = 0
    const uuid = vi.fn(() => id)
    const value = createCampaignAttribution({ allowed: () => true, now: () => time, uuid, campaigns: [campaign] })
    value.touch({ search: new URLSearchParams(campaign).toString() })
    time = SESSION_IDLE_MS
    expect(value.touch()).toMatchObject({ status: 'direct', campaign: null })
    expect(uuid).toHaveBeenCalledTimes(2)
  })
  it('discards unsafe/corrupt persisted payloads and never stores raw search/referrer', () => {
    const storage = data()
    storage.setItem(ATTRIBUTION_STORAGE_KEY, '{"email":"person@example.invalid"}')
    const value = createCampaignAttribution({ allowed: () => true, storage, uuid: () => id })
    expect(value.touch({ search: '?utm_source=person@example.invalid', referrer: 'https://unknown.invalid/private' })).toMatchObject({ status: 'invalid_campaign', referrer: '', campaign: null })
    expect(storage.getItem(ATTRIBUTION_STORAGE_KEY)).not.toContain('person')
    value.revoke()
    expect(storage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull()
  })
})
