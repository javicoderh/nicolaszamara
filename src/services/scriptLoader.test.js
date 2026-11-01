import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadExternalScript } from './scriptLoader.js'

afterEach(() => vi.useRealTimers())
describe('script loader', () => {
  it('reuses one load promise per document and never exposes a full referrer', async () => {
    const doc = document.implementation.createHTMLDocument('fixture')
    const options = { id: 'provider', src: 'https://provider.invalid/tag' }
    const first = loadExternalScript(doc, options)
    expect(loadExternalScript(doc, options)).toBe(first)
    expect(doc.querySelectorAll('script')).toHaveLength(1)
    const script = doc.querySelector('script')
    expect(script.referrerPolicy).toBe('strict-origin')
    script.dispatchEvent(new Event('load'))
    expect(await first).toBe(true)
  })
  it('removes a failed script and does not loop on failure', async () => {
    const doc = document.implementation.createHTMLDocument('fixture')
    const options = { id: 'broken', src: 'https://provider.invalid/broken' }
    const result = loadExternalScript(doc, options)
    doc.querySelector('script').dispatchEvent(new Event('error'))
    expect(await result).toBe(false)
    expect(await loadExternalScript(doc, options)).toBe(false)
    expect(doc.querySelector('script')).toBeNull()
  })
  it('times out with fake timers and handles server rendering', async () => {
    vi.useFakeTimers()
    const doc = document.implementation.createHTMLDocument('fixture')
    const result = loadExternalScript(doc, { id: 'slow', src: 'https://provider.invalid/slow' })
    await vi.advanceTimersByTimeAsync(30000)
    expect(await result).toBe(false)
    expect(doc.querySelector('script')).toBeNull()
    expect(await loadExternalScript(null, { id: 'server', src: '' })).toBe(false)
  })
})
