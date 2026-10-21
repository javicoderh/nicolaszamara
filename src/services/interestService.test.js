import { describe, expect, it } from 'vitest'
import { submitInterest } from './interestService.js'

describe('submitInterest', () => {
  it('indica que no hay servicio configurado y no inventa un registro', async () => {
    await expect(submitInterest({ interest: 'nature' })).resolves.toEqual({ status: 'unavailable' })
  })
})
