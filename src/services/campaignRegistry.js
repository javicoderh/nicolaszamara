import registry from '../../config/marketing/campaigns.json'

// A whole approved tuple is required; never combine unrelated campaign values.
export function resolveCampaign(params, campaigns = registry.campaigns) {
  if (!(params instanceof URLSearchParams)) return null
  const keys = ['utm_id', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
  if (params.has('utm_term') || keys.some((key) => params.getAll(key).length !== 1)) return null
  const campaign = campaigns.find((entry) => keys.every((key) =>
    typeof entry[key] === 'string' && entry[key].length <= 80 && /^[a-z0-9_-]+$/.test(entry[key]) && params.get(key) === entry[key],
  ))
  return campaign ? Object.fromEntries(keys.map((key) => [key, campaign[key]])) : null
}
