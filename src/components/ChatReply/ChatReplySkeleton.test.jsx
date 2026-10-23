import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ChatReplySkeleton from './ChatReplySkeleton.jsx'
describe('ChatReplySkeleton', () => {
  it('reserves the reply region immediately', () => {
    render(<ChatReplySkeleton />)
    expect(screen.getByRole('status', { name: 'Preparando orientación' })).toHaveAttribute('aria-busy', 'true')
  })
})
