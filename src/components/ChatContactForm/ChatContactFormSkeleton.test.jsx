import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ChatContactFormSkeleton from './ChatContactFormSkeleton.jsx'
describe('ChatContactFormSkeleton', () => {
  it('announces the independent save region immediately', () => {
    render(<ChatContactFormSkeleton />)
    expect(screen.getByRole('status', { name: 'Guardando solicitud de contacto' })).toHaveAttribute('aria-busy', 'true')
  })
})
