import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PhotoPlaceholder from './PhotoPlaceholder.jsx'
import PhotoPlaceholderSkeleton from './PhotoPlaceholderSkeleton.jsx'

describe('PhotoPlaceholder', () => {
  it('presenta una decoración sin simular una fotografía ni mostrar rótulos', () => {
    const { container } = render(<PhotoPlaceholder orientation="portrait" />)
    expect(container.firstChild).toHaveClass('photo-placeholder--portrait')
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.firstChild).toHaveTextContent('')
    expect(container.querySelector('[role="img"], figcaption')).toBeNull()
  })

  it('ofrece un skeleton propio', () => {
    const { container } = render(<PhotoPlaceholderSkeleton />)
    expect(container.firstChild).toHaveClass('photo-skeleton')
  })
})
