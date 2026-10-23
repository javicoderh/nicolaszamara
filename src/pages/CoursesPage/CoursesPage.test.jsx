import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteContentProvider } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import CoursesPage from './CoursesPage.jsx'
import CoursesPageSkeleton from './CoursesPageSkeleton.jsx'

describe('CoursesPage', () => {
  it('enlaza a la landing aprobada y distingue el interés de una matrícula', () => {
    render(<SiteContentProvider><CoursesPage /></SiteContentProvider>)
    expect(screen.getByRole('link', { name: /ver el curso e inscribirme/i })).toHaveAttribute('href', 'https://nzamara-mtc.hotmart.host/flores-de-bach-vida-cotidiana')
    expect(screen.getAllByText(/recibir información sobre el curso online/i)[0]).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /curso online para público hispanohablante/i })).toBeInTheDocument()
    expect(screen.queryByText(/futura modalidad online/i)).not.toBeInTheDocument()
  })

  it('ofrece un skeleton propio', () => {
    render(<CoursesPageSkeleton />)
    expect(screen.getByLabelText('Cargando cursos')).toHaveAttribute('aria-busy', 'true')
  })

  it('muestra la presentación botánica junto al texto del curso', () => {
    render(<SiteContentProvider><CoursesPage /></SiteContentProvider>)
    const photo = screen.getByRole('img', { name: 'Presentación de botánica con una flor amarilla proyectada en pantalla' })
    expect(photo).toHaveAttribute('src', '/photos/presentacion-botanica-1280.jpg')
    expect(photo).toHaveAttribute('srcset', '/photos/presentacion-botanica-640.jpg 640w, /photos/presentacion-botanica-1280.jpg 1280w')
    expect(photo.closest('section')).toHaveAttribute('aria-labelledby', 'bach-title')
    expect(photo.parentElement).toHaveClass('courses-page__photo-frame')
    expect(photo.parentElement.previousElementSibling).toContainElement(screen.getByRole('heading', { name: 'Flores de Bach para la vida cotidiana' }))
    expect(photo.parentElement.previousElementSibling).toContainElement(screen.getByRole('link', { name: /ver el curso e inscribirme/i }))
  })
})
