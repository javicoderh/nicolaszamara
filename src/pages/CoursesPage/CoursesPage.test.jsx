import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteContentProvider } from '../../contexts/SiteContentContext/SiteContentContext.jsx'
import CoursesPage from './CoursesPage.jsx'
import CoursesPageSkeleton from './CoursesPageSkeleton.jsx'

describe('CoursesPage', () => {
  it('enlaza a la landing aprobada y distingue el interés de una matrícula', () => {
    render(<SiteContentProvider><CoursesPage /></SiteContentProvider>)
    expect(screen.getByRole('link', { name: /ver curso e inscripción/i })).toHaveAttribute('href', 'https://nzamara-mtc.hotmart.host/flores-de-bach-vida-cotidiana')
    expect(screen.getByText(/aún no hay fechas ni matrícula abierta/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /futura modalidad online/i })).toBeInTheDocument()
  })

  it('ofrece un skeleton propio', () => {
    render(<CoursesPageSkeleton />)
    expect(screen.getByLabelText('Cargando cursos')).toHaveAttribute('aria-busy', 'true')
  })
})
