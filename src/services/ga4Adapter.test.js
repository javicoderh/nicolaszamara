import { describe, expect, it, vi } from 'vitest'
import { createGa4Adapter } from './ga4Adapter.js'
import { createPageContext } from './analyticsPageContext.js'

const click = { element_id: 'hero_nature', placement: 'home_hero', service: 'nature', destination_path: '/naturaleza' }
function setup({ allowed = () => true, measurementId = 'G-TEST', loadScript = vi.fn().mockResolvedValue(true) } = {}) {
  const windowRef = {}
  const adapter = createGa4Adapter({ measurementId, allowed, windowRef, documentRef: {}, loadScript })
  const commands = () => (windowRef.dataLayer || []).map((args) => [...args])
  return { adapter, windowRef, loadScript, commands }
}
describe('GA4 adapter', () => {
  it('does not load a script without permission, valid ID or valid event data', async () => {
    for (const options of [{ allowed: () => false }, { measurementId: '' }]) {
      const value = setup(options)
      expect(await value.adapter.send('cta_click', click, createPageContext('/'))).toBe(false)
      expect(value.loadScript).not.toHaveBeenCalled()
    }
    const value = setup()
    expect(await value.adapter.send('cta_click', { ...click, email: 'person@example.invalid' }, createPageContext('/'))).toBe(false)
    expect(value.loadScript).not.toHaveBeenCalled()
  })
  it('loads once and configures consent and page fields without automatic page views', async () => {
    const value = setup()
    await Promise.all([value.adapter.send('cta_click', click, createPageContext('/')), value.adapter.send('cta_click', click, createPageContext('/'))])
    expect(value.loadScript).toHaveBeenCalledOnce()
    expect(value.commands().filter(([name]) => name === 'config')).toHaveLength(1)
    expect(value.commands().find(([name]) => name === 'config')[2]).toMatchObject({ send_page_view: false, allow_google_signals: false, page_location: 'https://www.nicolaszamara.com/' })
    expect(value.commands().filter(([name]) => name === 'event')).toHaveLength(2)
    expect(value.commands()[0]).toEqual(['consent', 'default', expect.objectContaining({ analytics_storage: 'denied', ad_storage: 'denied' })])
  })
  it('does not send queued events when revoked while the script is loading', async () => {
    let resolve
    const value = setup({ loadScript: () => new Promise((done) => { resolve = done }) })
    const result = value.adapter.send('cta_click', click, createPageContext('/'))
    value.adapter.stop()
    resolve(true)
    expect(await result).toBe(false)
    expect(value.windowRef['ga-disable-G-TEST']).toBe(true)
    expect(value.commands().some(([name]) => name === 'event')).toBe(false)
  })
  it('absorbs loader failure without retrying for every click', async () => {
    const value = setup({ loadScript: vi.fn().mockRejectedValue(Error('blocked')) })
    expect(await value.adapter.send('cta_click', click, createPageContext('/'))).toBe(false)
    expect(await value.adapter.send('cta_click', click, createPageContext('/'))).toBe(false)
    expect(value.loadScript).toHaveBeenCalledOnce()
  })
})
