import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import ArticleContent from './ArticleContent.jsx'
import ArticleContentSkeleton from './ArticleContentSkeleton.jsx'
it('renders prose safely and ignores unsupported blocks and script links', () => {
  render(<ArticleContent article={{ title: 'Una lectura', category: 'naturaleza', document: { blocks: [
    { type: 'paragraph', text: '<script>alert(1)</script>' }, { type: 'html', text: 'invisible' }, { type: 'link', href: 'javascript:alert(1)', text: 'unsafe' },
  ] } }} />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Una lectura')
  expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument()
  expect(document.querySelector('script')).toBeNull()
  expect(screen.queryByText('unsafe')).toBeNull()
})
it('reserves reader skeleton space', () => { render(<ArticleContentSkeleton />); expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true') })
it('shows the opening image and an interior image among the prose with private previews', () => {
  const { container } = render(<ArticleContent privateMedia article={{ title: 'Bosque', category: 'naturaleza', cover: '/blog-media/cover', coverAlt: 'Vista del bosque',
    bodyImage: { src: '/blog-media/body', alt: 'Camino entre arboles', alignment: 'left', afterBlock: 0, caption: 'Un lugar para detenerse' },
    document: { blocks: [{ type: 'paragraph', text: 'Primera parte' }, { type: 'paragraph', text: 'Seguimos el camino' }] } }} />)
  expect(screen.getAllByRole('img')).toHaveLength(2)
  expect(screen.getByAltText('Vista del bosque')).toHaveAttribute('src', '/api/admin/media?id=cover&preview=1')
  const interior = screen.getByAltText('Camino entre arboles').closest('figure')
  expect(interior).toHaveClass('article-content__interior--left')
  expect(interior.previousElementSibling).toHaveTextContent('Primera parte')
  expect(interior.nextElementSibling).toHaveTextContent('Seguimos el camino')
  expect(container.querySelector('figcaption')).toHaveTextContent('Un lugar para detenerse')
})
