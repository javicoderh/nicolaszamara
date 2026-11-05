import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AboutPage from './AboutPage.jsx'
import AboutPageSkeleton from './AboutPageSkeleton.jsx'
import { aboutContent } from '../../content/siteContent.js'

describe('AboutPage', () => {
  it('presenta MAYA-844 con variantes adaptadas a la pantalla', () => {
    render(<AboutPage />)
    const photo = screen.getByRole('img', { name: 'Nicolás Zamara sentado en un jardín' })
    expect(photo).toHaveAttribute('src', '/photos/sobre-mi-maya-844-960.jpg')
    expect(photo).toHaveAttribute('srcset', '/photos/sobre-mi-maya-844-480.jpg 480w, /photos/sobre-mi-maya-844-960.jpg 960w')
    expect(photo).toHaveAttribute('fetchpriority', 'high')
    expect(photo).toHaveAttribute('width', '960')
    expect(photo).toHaveAttribute('height', '1439')
  })
  it('presenta únicamente la biografía en su contenido principal', () => {
    render(<AboutPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Soy Nicolás Zamara.' })).toBeInTheDocument()
    for (const paragraph of aboutContent.paragraphs) expect(screen.getByText(paragraph)).toBeInTheDocument()
    expect(screen.getAllByRole('heading')).toHaveLength(1)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText('Flores de Bach para la vida cotidiana')).not.toBeInTheDocument()
    expect(screen.queryByText('Baños de bosque: un espacio para bajar el ritmo y conectar con la naturaleza.')).not.toBeInTheDocument()
  })

  it('ofrece un skeleton inmediato de la biografía', () => {
    const { container } = render(<AboutPageSkeleton />)
    expect(screen.getByLabelText('Cargando sobre mí')).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelectorAll('span')).toHaveLength(4)
    expect(container.querySelector('.about-skeleton__photo')).toBeInTheDocument()
  })
})
