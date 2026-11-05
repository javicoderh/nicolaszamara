import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import AdminBlog from './AdminBlog.jsx'
import { adminRequest } from '../../services/adminService.js'
import { uploadBlogImage } from '../../services/blogMediaService.js'
vi.mock('../../services/adminService.js', () => ({ adminRequest: vi.fn(), adminErrorMessage: () => 'Error de prueba' }))
vi.mock('../../services/blogMediaService.js', () => ({
  decodeEditorialImage: vi.fn(async () => ({ width: 1200, height: 800, close: vi.fn() })),
  drawEditorialImage: vi.fn(), uploadBlogImage: vi.fn(), editorialMediaUrl: src => src,
  editorialSrcSet: () => undefined,
}))
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); sessionStorage.clear() })
const settle = () => act(async () => vi.advanceTimersByTimeAsync(800))

it('saves and reopens a complete manual article with pasted text, images and SEO without creating a generation job', async () => {
  vi.useFakeTimers()
  let saved
  adminRequest.mockImplementation(async ({ action, values }) => {
    if (action === 'create') {
      saved = { id: values.id, version: 1, state: 'draft', document: structuredClone(values.document) }
      return { status: 'ready', article: saved }
    }
    if (action === 'detail') return { status: 'ready', article: saved, revisions: [] }
    return { status: 'ready', items: action === 'list' && saved ? [{ ...saved, title: saved.document.title }] : [] }
  })
  uploadBlogImage.mockResolvedValueOnce({ src: '/blog-media/00000000-0000-4000-8000-000000000001' })
    .mockResolvedValueOnce({ src: '/blog-media/00000000-0000-4000-8000-000000000002' })
  renderExpanded(<AdminBlog onExpired={vi.fn()} />)
  await settle()
  fireEvent.click(screen.getByRole('button', { name: 'Crear manualmente' }))
  const fields = {
    'Título': 'Un artículo ya escrito', 'URL del artículo': 'un-articulo-ya-escrito', 'Introducción': 'Una lectura para conservar.',
    'Autor': 'Equipo editorial', 'Presentación del autor (opcional)': 'Presentación editorial.',
    'Revisor editorial (opcional)': 'Revisión técnica', 'Fecha de revisión editorial': '2026-11-04',
    'Frase principal SEO': 'paseos por bosques', 'Título SEO (opcional)': 'Paseos por bosques: observar con calma',
    'Descripción SEO (opcional)': 'Una descripción para buscadores.', 'Título al compartir (opcional)': 'Una pausa entre árboles',
    'Descripción al compartir (opcional)': 'Una descripción social.', 'Etiquetas internas (una por línea)': 'naturaleza\nobservacion',
    'Fuentes (una URL por línea)': 'https://example.org/fuente', 'Reels (una URL por línea)': 'https://www.instagram.com/reel/prueba/',
  }
  for (const [label, value] of Object.entries(fields)) fireEvent.change(screen.getByLabelText(label), { target: { value } })
  fireEvent.change(screen.getByLabelText('Título de la fuente 1'), { target: { value: 'Referencia del artículo' } })
  fireEvent.change(screen.getByLabelText('Etiqueta del reel 1'), { target: { value: 'Reel principal' } })
  for (const [label, value] of Object.entries({ Categoría: 'terapias', 'Invitación final': 'consultation', Indexación: 'noindex', 'Tarjeta social': 'summary', 'Preferencia para rastreadores de IA': 'disallow' })) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  }
  fireEvent.change(screen.getByLabelText('Artículo completo'), { target: { value: '## Una pausa\n\nContenido escrito de antemano.\n\n- Observar\n- Escuchar' } })
  fireEvent.click(screen.getByRole('button', { name: 'Añadir texto al contenido' }))
  await settle()
  for (const name of ['Imagen de apertura', 'Imagen interior']) {
    const region = within(screen.getByRole('region', { name }))
    fireEvent.change(region.getByLabelText(`Archivo para ${name.toLowerCase()}`), { target: { files: [new File(['image'], 'prueba.png', { type: 'image/png' })] } })
    await settle()
    fireEvent.click(region.getByRole('button', { name: 'Subir imagen y guardar recorte' }))
    await settle()
    fireEvent.change(region.getByLabelText(`Descripción accesible de ${name.toLowerCase()}`), { target: { value: `Descripción de ${name}` } })
    fireEvent.change(region.getByLabelText(`Pie de ${name.toLowerCase()} (opcional)`), { target: { value: `Pie de ${name}` } })
  }
  fireEvent.change(screen.getByLabelText('Alineación con el texto'), { target: { value: 'left' } })
  fireEvent.change(screen.getByLabelText('Ubicación de la imagen interior'), { target: { value: '0' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }))
  await settle()
  expect(saved.document).toMatchObject({ title: fields.Título, authorBio: 'Presentación editorial.', category: 'terapias', reviewer: 'Revisión técnica',
    seoTitle: fields['Título SEO (opcional)'], crawlPolicy: 'noindex', aiCrawlPolicy: 'disallow', twitterCard: 'summary', relatedServiceId: 'consultation',
    cover: '/blog-media/00000000-0000-4000-8000-000000000001', coverAlt: 'Descripción de Imagen de apertura',
    bodyImage: { src: '/blog-media/00000000-0000-4000-8000-000000000002', alt: 'Descripción de Imagen interior', alignment: 'left', afterBlock: 0 },
    document: { version: 1, blocks: [{ type: 'heading', level: 2, text: 'Una pausa' }, { type: 'paragraph', text: 'Contenido escrito de antemano.' }, { type: 'list', ordered: false, items: ['Observar', 'Escuchar'] }] },
    sourceDetails: [{ url: 'https://example.org/fuente', title: 'Referencia del artículo' }],
  })
  await settle()
  fireEvent.click(screen.getByRole('button', { name: 'Editar Un artículo ya escrito' }))
  await settle()
  expect(screen.getByLabelText('Título')).toHaveValue(fields.Título)
  expect(screen.getByLabelText('Descripción SEO (opcional)')).toHaveValue(fields['Descripción SEO (opcional)'])
  expect(screen.getByRole('button', { name: 'Publicar versión guardada' })).toBeEnabled()
  expect(adminRequest.mock.calls.some(([payload]) => payload.action === 'job_create' || payload.action === 'publish')).toBe(false)
})

function renderExpanded(element) {
  const view = render(element)
  view.container.querySelectorAll('[data-module-trigger]').forEach(button => fireEvent.click(button))
  return view
}
