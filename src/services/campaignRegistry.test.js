import { describe, expect, it } from 'vitest'
import { resolveCampaign } from './campaignRegistry.js'

const campaign = { utm_id: 'fixture-1', utm_source: 'fixture', utm_medium: 'test', utm_campaign: 'test-only', utm_content: 'hero' }
const params = () => new URLSearchParams(campaign)

describe('campaign registry', () => {
  it('rejects all campaigns with the initially empty production registry', () => {
    expect(resolveCampaign(params())).toBeNull()
  })
  it('returns only the exact registered tuple, discarding unrelated query parameters', () => {
    const input = params()
    input.set('email', 'person@example.invalid')
    expect(resolveCampaign(input, [campaign])).toEqual(campaign)
  })
  it('rejects duplicates, incomplete values, free terms and unapproved combinations', () => {
    for (const mutate of [
      (value) => value.append('utm_id', 'other'), (value) => value.delete('utm_content'),
      (value) => value.set('utm_term', 'sensitive'), (value) => value.set('utm_source', 'someone'),
      (value) => value.set('utm_campaign', 'person@example.invalid'),
    ]) {
      const input = params(); mutate(input)
      expect(resolveCampaign(input, [campaign])).toBeNull()
    }
  })
  it('returns a new object and rejects invalid parameter containers', () => {
    expect(resolveCampaign(params(), [campaign])).not.toBe(campaign)
    expect(resolveCampaign({ ...campaign }, [campaign])).toBeNull()
  })
})
