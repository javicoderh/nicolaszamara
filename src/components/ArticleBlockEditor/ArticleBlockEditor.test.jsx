import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import ArticleBlockEditor from './ArticleBlockEditor.jsx'
import ArticleBlockEditorSkeleton from './ArticleBlockEditorSkeleton.jsx'
afterEach(() => vi.useRealTimers())
it('imports a complete article after the base delay and preserves existing blocks by default', async () => {
  vi.useFakeTimers()
  const onChange = vi.fn()
  render(<ArticleBlockEditor document={{ version: 1, blocks: [{ type: 'paragraph', text: 'Original' }] }} onChange={onChange} />)
  fireEvent.change(screen.getByLabelText('Artículo completo'), { target: { value: '## Un paseo\n\nTexto ya escrito.' } })
  fireEvent.click(screen.getByRole('button', { name: 'Añadir texto al contenido' }))
  expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
  await act(async () => vi.advanceTimersByTimeAsync(799))
  expect(onChange).not.toHaveBeenCalled()
  await act(async () => vi.advanceTimersByTimeAsync(1))
  expect(onChange).toHaveBeenCalledWith({ version: 1, blocks: [{ type: 'paragraph', text: 'Original' }, { type: 'heading', level: 2, text: 'Un paseo' }, { type: 'paragraph', text: 'Texto ya escrito.' }] })
  expect(screen.getByLabelText('Artículo completo')).toHaveValue('')
})
it('replaces existing content only through the explicit replace action', async () => {
  vi.useFakeTimers()
  const onChange = vi.fn()
  render(<ArticleBlockEditor document={{ version: 1, blocks: [{ type: 'paragraph', text: 'Original' }] }} onChange={onChange} />)
  fireEvent.change(screen.getByLabelText('Artículo completo'), { target: { value: 'Reemplazo.' } })
  fireEvent.click(screen.getByRole('button', { name: 'Reemplazar todo el contenido con este texto' }))
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(onChange).toHaveBeenCalledWith({ version: 1, blocks: [{ type: 'paragraph', text: 'Reemplazo.' }] })
})
it('formats only selected text and keeps the structured document',()=>{const onChange=vi.fn();render(<ArticleBlockEditor document={{version:1,blocks:[{type:'paragraph',text:'Un bosque tranquilo'}]}} onChange={onChange}/>);const input=screen.getByLabelText('Texto');input.setSelectionRange(3,9);fireEvent.click(screen.getByRole('button',{name:'Negrita'}));expect(onChange).toHaveBeenCalledWith({version:1,blocks:[{type:'paragraph',text:'Un **bosque** tranquilo'}]})})
it('reserves editor space',()=>{render(<ArticleBlockEditorSkeleton/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})
