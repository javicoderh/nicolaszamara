import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ChatbotSkeleton from './ChatbotSkeleton.jsx'

describe('ChatbotSkeleton', () => {
  it('reserves launcher space without announcing interactive content', () => {
    const { container } = render(<ChatbotSkeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.firstChild).toHaveClass('chatbot-skeleton')
  })
})
