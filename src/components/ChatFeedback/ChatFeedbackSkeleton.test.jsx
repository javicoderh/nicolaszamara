import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import ChatFeedbackSkeleton from './ChatFeedbackSkeleton.jsx'

it('shows an immediate accessible save placeholder', () => {
  render(<ChatFeedbackSkeleton />)
  expect(screen.getByRole('status', { name: 'Guardando propuesta' })).toHaveAttribute('aria-busy', 'true')
})
