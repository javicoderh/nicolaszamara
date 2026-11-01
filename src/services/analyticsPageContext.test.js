import { expect, it } from 'vitest'
import { cleanReferrer, createPageContext } from './analyticsPageContext.js'

it('uses catalog data and never echoes unknown or sensitive path values', () => {
  expect(createPageContext('/cursos/')).toMatchObject({ page_path: '/cursos', page_type: 'courses' })
  expect(createPageContext('/someone@example.invalid')).toMatchObject({ page_path: '/404', page_type: 'not_found' })
  expect(createPageContext('/cursos?email=person').page_location).toBe('https://www.nicolaszamara.com/404')
})
it('removes query and fragment from approved referrers and rejects unknown hosts', () => {
  expect(cleanReferrer('https://www.google.com/search?q=private')).toBe('https://www.google.com/')
  expect(cleanReferrer('https://www.nicolaszamara.com/cursos?email=person#section')).toBe('https://www.nicolaszamara.com/cursos')
  expect(cleanReferrer('https://private.invalid/customer')).toBe('')
  expect(cleanReferrer('https://person@www.google.com/')).toBe('')
})
