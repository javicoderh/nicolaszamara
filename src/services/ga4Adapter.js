import { ANALYTICS_SCHEMA_VERSION, SITE_VERSION, validateAnalyticsEvent } from '../config/analytics.js'
import { loadExternalScript } from './scriptLoader.js'
import { resolveCampaign } from './campaignRegistry.js'

const denied = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }

export function createGa4Adapter({ measurementId, allowed, windowRef, documentRef, environment = 'development', loadScript = loadExternalScript }) {
  let loading = null
  let initialized = false
  let generation = 0
  let campaignFields = {}
  const validId = /^G-[A-Z0-9]+$/.test(measurementId || '')
  function pageFields(page) {
    return { page_title: page.page_title, page_location: page.page_location, page_referrer: page.page_referrer }
  }
  function permitted() { return validId && Boolean(windowRef) && allowed() }
  function command(...args) { windowRef.gtag(...args) }
  function configure(page) {
    windowRef[`ga-disable-${measurementId}`] = false
    command('consent', 'update', { ...denied, analytics_storage: 'granted' })
    command('js', new Date())
    command('config', measurementId, { send_page_view: false, allow_google_signals: false,
      allow_ad_personalization_signals: false, ...pageFields(page), ...campaignFields })
    initialized = true
  }
  async function start(page) {
    if (!permitted() || !validateAnalyticsEvent('page_view', pageFields(page))) return false
    if (initialized) return true
    const current = generation
    if (!loading) {
      windowRef[`ga-disable-${measurementId}`] = true
      windowRef.dataLayer ||= []
      windowRef.gtag ||= function () { windowRef.dataLayer.push(arguments) }
      command('consent', 'default', denied)
      loading = loadScript(documentRef, { id: `nzamara-ga4-${measurementId}`, src: `https://www.googletagmanager.com/gtag/js?id=${measurementId}` })
    }
    let loaded = false
    try { loaded = await loading } catch { return false }
    if (!loaded || current !== generation || !permitted()) return false
    if (!initialized) configure(page)
    return true
  }
  return {
    async send(name, params, page, stillCurrent = () => true) {
      if (!stillCurrent() || !validateAnalyticsEvent(name, params) || !await start(page) || !permitted() || !stillCurrent()) return false
      // Subsequent automatic engagement events also inherit sanitized page fields.
      command('set', pageFields(page))
      command('event', name, { ...params, ...pageFields(page), ...campaignFields, schema_version: ANALYTICS_SCHEMA_VERSION, site_version: SITE_VERSION,
        environment: ['production', 'qa'].includes(environment) ? environment : 'development', send_to: measurementId })
      return true
    },
    updatePage(page) {
      if (initialized && permitted() && validateAnalyticsEvent('page_view', pageFields(page))) command('set', pageFields(page))
    },
    setCampaign(campaign) {
      const value = campaign && resolveCampaign(new URLSearchParams(campaign))
      campaignFields = value ? { campaign_id: value.utm_id, campaign_source: value.utm_source, campaign_medium: value.utm_medium,
        campaign_name: value.utm_campaign, campaign_content: value.utm_content } : {}
    },
    stop() {
      generation += 1
      initialized = false
      campaignFields = {}
      if (windowRef && validId) windowRef[`ga-disable-${measurementId}`] = true
    },
  }
}
