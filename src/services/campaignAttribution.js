import registry from '../../config/marketing/campaigns.json'
import { resolveCampaign } from './campaignRegistry.js'
import { cleanReferrer } from './analyticsPageContext.js'

export const ATTRIBUTION_STORAGE_KEY = 'nzamara:marketing-session'
export const SESSION_IDLE_MS = 30 * 60 * 1000
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const statuses = ['approved_campaign', 'invalid_campaign', 'direct', 'referral', 'unknown']

export function createCampaignAttribution({ allowed, storage = null, now = Date.now, uuid = () => crypto.randomUUID(), campaigns = registry.campaigns }) {
  let session = null
  function valid(value) {
    return value && Object.keys(value).sort().join() === 'campaign,last_activity,referrer,session_id,status,version'
      && value.version === 1 && typeof value.session_id === 'string' && uuidPattern.test(value.session_id) && statuses.includes(value.status)
      && Number.isFinite(value.last_activity) && value.last_activity <= now() && now() - value.last_activity < SESSION_IDLE_MS
      && typeof value.referrer === 'string' && cleanReferrer(value.referrer) === value.referrer
      && (value.status === 'approved_campaign') === (value.campaign !== null)
      && (value.campaign === null || JSON.stringify(resolveCampaign(new URLSearchParams(value.campaign), campaigns)) === JSON.stringify(value.campaign))
  }
  function forget() {
    session = null
    try { storage?.removeItem(ATTRIBUTION_STORAGE_KEY) } catch { /* Storage can be blocked. */ }
  }
  return {
    touch({ search = '', referrer = '' } = {}) {
      if (!allowed()) { forget(); return null }
      if (!session) {
        try { const value = JSON.parse(storage?.getItem(ATTRIBUTION_STORAGE_KEY)); if (valid(value)) session = value } catch { /* No valid previous session. */ }
      }
      if (!valid(session)) {
        const params = new URLSearchParams(search)
        const campaign = resolveCampaign(params, campaigns)
        const clean = cleanReferrer(referrer)
        session = { version: 1, session_id: uuid(), last_activity: now(), campaign,
          status: campaign ? 'approved_campaign' : [...params.keys()].some((key) => key.startsWith('utm_')) ? 'invalid_campaign'
            : !referrer ? 'direct' : clean ? 'referral' : 'unknown', referrer: clean }
      }
      session = { ...session, last_activity: now() }
      try { storage?.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(session)) } catch { /* Memory-only session remains usable. */ }
      return { ...session, campaign: session.campaign ? { ...session.campaign } : null }
    },
    revoke: forget,
  }
}
