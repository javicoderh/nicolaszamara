import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ContactPreferenceSkeleton from './ContactPreferenceSkeleton.jsx'
describe('ContactPreferenceSkeleton', () => {
  it('immediately reserves the three choices without interactive controls', () => {
    const { container } = render(<ContactPreferenceSkeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelectorAll('span')).toHaveLength(3)
    expect(container.querySelector('input')).toBeNull()
  })
})
