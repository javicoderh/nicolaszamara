import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import NotFoundPage from './NotFoundPage.jsx'
import NotFoundPageSkeleton from './NotFoundPageSkeleton.jsx'

describe('NotFoundPage', () => {
  it('ofrece una ruta clara para volver al inicio', () => {
    render(<NotFoundPage />)
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/')
  })

  it('ofrece un skeleton propio', () => {
    render(<NotFoundPageSkeleton />)
    expect(screen.getByLabelText('Cargando página no encontrada')).toHaveAttribute('aria-busy', 'true')
  })
})
