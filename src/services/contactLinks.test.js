import { describe, expect, it } from 'vitest'
import { whatsappLink, contactMessages } from './contactLinks.js'
import { attentionLocations } from '../content/attentionLocations.js'

describe('public contact links', () => {
  it('preserves accents, punctuation and every approved message when encoded', () => {
    for (const message of [...Object.values(contactMessages), ...attentionLocations.map(item => item.message)]) {
      const url = new URL(whatsappLink(message))
      expect(url.hostname).toBe('wa.me')
      expect(url.pathname).toBe('/56953961219')
      expect(url.searchParams.get('text')).toBe(message)
    }
  })
})
