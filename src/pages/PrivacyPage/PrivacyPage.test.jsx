import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PrivacyPage from './PrivacyPage.jsx'
import PrivacyPageSkeleton from './PrivacyPageSkeleton.jsx'

describe('PrivacyPage', () => {
  it('explica el uso de datos sin avisos de prueba ni instrucciones internas', () => {
    render(<PrivacyPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Privacidad' })).toBeInTheDocument()
    expect(screen.getByText(/en los formularios de interés se guardan tu nombre, correo/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Solicitud de contacto desde el asistente' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Origen de las solicitudes y clics en el curso' })).toBeInTheDocument()
    expect(screen.getByText(/para contar clics al enlace del curso/i)).toHaveTextContent(/no enviamos nombres, correos, teléfonos ni mensajes/i)
    expect(screen.getByText(/versión de esta autorización: 23 de octubre de 2026/i)).toHaveTextContent(/no se envían al modelo de OpenAI/i)
    expect(screen.queryByText(/\b(?:pruebas|ficticios|revisión del sitio|pendiente|completar y aprobar)\b/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('ofrece un skeleton propio', () => {
    render(<PrivacyPageSkeleton />)
    expect(screen.getByLabelText('Cargando privacidad')).toHaveAttribute('aria-busy', 'true')
  })
})
