import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import ChatbotPageSkeleton from './ChatbotPageSkeleton.jsx'

it('immediately reserves the page while hiding decorative placeholders', () => {
  const { container } = render(<ChatbotPageSkeleton />)
  expect(screen.getByRole('main', { name: 'Cargando conversación' })).toHaveAttribute('aria-busy', 'true')
  expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2)
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})
