import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ArticleImageEditor from './ArticleImageEditor.jsx'
import ArticleImageEditorSkeleton from './ArticleImageEditorSkeleton.jsx'
import { decodeEditorialImage, uploadBlogImage } from '../../services/blogMediaService.js'
vi.mock('../../services/blogMediaService.js', () => ({
  decodeEditorialImage: vi.fn(), drawEditorialImage: vi.fn(), uploadBlogImage: vi.fn(),
  editorialMediaUrl: src => src,
}))
beforeEach(() => { vi.useFakeTimers(); decodeEditorialImage.mockResolvedValue({ width: 1200, height: 800, close: vi.fn() }); uploadBlogImage.mockResolvedValue({ src: '/blog-media/new-image' }) })
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })
async function settle(ms = 0) { await act(async () => { await vi.advanceTimersByTimeAsync(ms) }) }
it('previews a chosen image after the base delay and saves the adjusted crop', async () => {
  const onChange = vi.fn()
  render(<ArticleImageEditor label="Imagen interior" onChange={onChange} aspect={.8} />)
  fireEvent.change(screen.getByLabelText('Archivo para imagen interior'), { target: { files: [new File(['image'], 'photo.png', { type: 'image/png' })] } })
  expect(screen.getByRole('status')).toBeInTheDocument()
  await settle(799)
  expect(screen.queryByRole('slider')).toBeNull()
  await settle(1)
  expect(screen.getByRole('status')).toHaveTextContent('Vista previa local.')
  expect(uploadBlogImage).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Acercamiento'), { target: { value: '2' } })
  fireEvent.click(screen.getByRole('button', { name: 'Subir imagen y guardar recorte' }))
  await settle(799)
  expect(onChange).not.toHaveBeenCalled()
  await settle(1)
  expect(uploadBlogImage).toHaveBeenCalledWith(expect.any(File), expect.any(AbortSignal), expect.objectContaining({ aspect: .8, zoom: 2 }))
  expect(onChange).toHaveBeenCalledWith({ src: '/blog-media/new-image',position:{x:50,y:50} })
})
it('retains the crop after an upload failure so it can be retried', async () => {
  uploadBlogImage.mockRejectedValueOnce(new Error('unavailable'))
  render(<ArticleImageEditor label="Imagen de apertura" onChange={vi.fn()} />)
  fireEvent.change(screen.getByLabelText('Archivo para imagen de apertura'), { target: { files: [new File(['x'], 'photo.png', { type: 'image/png' })] } })
  await settle(800)
  fireEvent.click(screen.getByRole('button', { name: 'Subir imagen y guardar recorte' }))
  await settle(800)
  expect(screen.getByRole('alert')).toHaveTextContent('Conservamos el recorte')
  expect(screen.getByRole('button', { name: 'Subir imagen y guardar recorte' })).toBeEnabled()
})
it('provides an immediate accessible loading placeholder', () => {
  render(<ArticleImageEditorSkeleton label="Guardando imagen" />)
  expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
})
