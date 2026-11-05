import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import AdminBlog from './AdminBlog.jsx'
import AdminBlogSkeleton from './AdminBlogSkeleton.jsx'
import { adminRequest } from '../../services/adminService.js'
vi.mock('../../services/adminService.js', () => ({ adminRequest: vi.fn(), adminErrorMessage: () => 'No pudimos guardar.' }))
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); sessionStorage.clear() })
it('uses a free idea textarea and submits the complete narrative without form fields', async () => {
  vi.useFakeTimers()
  adminRequest.mockImplementation(async ({ action }) => action === 'job_create' ? { status: 'ready' } : { status: 'ready', items: [] })
  renderExpanded(<AdminBlog onExpired={vi.fn()} />)
  await act(async () => vi.advanceTimersByTimeAsync(800))
  const idea = 'Un artículo poético y storytelling sobre bosques para adultos de 50 años, buscando engagement.'
  fireEvent.change(screen.getByLabelText('Tu idea'), { target: { value: idea } })
  fireEvent.click(screen.getByRole('button', { name: 'Generar artículo' }))
  await act(async () => vi.advanceTimersByTimeAsync(800))
  expect(adminRequest).toHaveBeenCalledWith(expect.objectContaining({ action: 'job_create', values: expect.objectContaining({ idea }) }), expect.any(AbortSignal))
  expect(screen.getByText('Idea recibida. Puedes revisar el avance en la cola.')).toHaveAttribute('role', 'status')
})
it('creates a structured manual draft and lets the admin add paragraph blocks', async () => {
  vi.useFakeTimers()
  adminRequest.mockResolvedValue({ status: 'ready', items: [] })
  renderExpanded(<AdminBlog onExpired={vi.fn()} />)
  await act(async () => vi.advanceTimersByTimeAsync(800))
  fireEvent.click(screen.getByRole('button', { name: 'Crear manualmente' }))
  expect(screen.getByRole('region', { name: 'Imagen de apertura' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Imagen interior' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '+ Párrafo' }))
  fireEvent.change(screen.getByLabelText('Texto'), { target: { value: 'Un texto que respira.' } })
  fireEvent.click(screen.getByRole('button', { name: 'Vista previa' }))
  expect(within(screen.getByRole('article')).getByText('Un texto que respira.')).toBeInTheDocument()
})
it('provides an immediate region skeleton', () => { render(<AdminBlogSkeleton />); expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true') })
it('preserves edited text and pauses autosave after a conflict',async()=>{
 vi.useFakeTimers()
 const document={title:'Un bosque',slug:'un-bosque',summary:'Resumen',author:'Equipo',category:'naturaleza',document:{version:1,blocks:[{type:'paragraph',text:'Un paseo con calma.'}]}}
 const article={id:'00000000-0000-4000-8000-000000000001',state:'draft',version:1,document}
 adminRequest.mockImplementation(async({action})=>{
  if(action==='list')return {status:'ready',items:[{...article,title:document.title}]}
  if(action==='detail')return {status:'ready',article,revisions:[]}
  if(action==='save')throw {status:'conflict'}
  return {status:'ready',items:[]}
 })
 renderExpanded(<AdminBlog onExpired={vi.fn()}/>);await act(async()=>vi.advanceTimersByTimeAsync(800))
 fireEvent.click(screen.getByRole('button',{name:'Editar Un bosque'}));await act(async()=>vi.advanceTimersByTimeAsync(800))
 fireEvent.change(screen.getByLabelText('Título'),{target:{value:'Una edición que conservar'}})
 await act(async()=>vi.advanceTimersByTimeAsync(1499));expect(adminRequest.mock.calls.filter(([payload])=>payload.action==='save')).toHaveLength(0)
 await act(async()=>vi.advanceTimersByTimeAsync(801));expect(screen.getByLabelText('Título')).toHaveValue('Una edición que conservar')
 expect(screen.getByRole('alert')).toHaveTextContent('No pudimos guardar.')
 await act(async()=>vi.advanceTimersByTimeAsync(4000));expect(adminRequest.mock.calls.filter(([payload])=>payload.action==='save')).toHaveLength(1)
 expect(screen.getByRole('button',{name:'Publicar versión guardada'})).toBeDisabled()
})
it('reuses the generation identifier after a failed request and blocks double clicks',async()=>{
 vi.useFakeTimers();adminRequest.mockImplementation(async({action})=>{if(action==='job_create')throw {status:'unavailable'};return {status:'ready',items:[]}})
 renderExpanded(<AdminBlog onExpired={vi.fn()}/>);await act(async()=>vi.advanceTimersByTimeAsync(800))
 fireEvent.change(screen.getByLabelText('Tu idea'),{target:{value:'Un artículo sobre la observación del bosque.'}})
 const button=screen.getByRole('button',{name:'Generar artículo'});fireEvent.click(button);fireEvent.click(button)
 await act(async()=>vi.advanceTimersByTimeAsync(800));fireEvent.click(button);await act(async()=>vi.advanceTimersByTimeAsync(800))
 const calls=adminRequest.mock.calls.filter(([payload])=>payload.action==='job_create')
 expect(calls).toHaveLength(2);expect(calls[0][0].values.id).toBe(calls[1][0].values.id)
 expect(screen.getByLabelText('Tu idea')).toHaveValue('Un artículo sobre la observación del bosque.')
})
it('keeps a slow queue request alive and schedules the next poll after completion', async () => {
  vi.useFakeTimers()
  let finish, queueSignal
  let calls = 0
  adminRequest.mockImplementation(({ action }, signal) => {
    if (action !== 'jobs') return Promise.resolve({ status: 'ready', items: [] })
    calls++
    if (calls === 2) { queueSignal = signal; return new Promise(resolve => { finish = resolve }) }
    return Promise.resolve({ status: 'ready', items: [{ id: 'job', idea: 'Un paseo por el bosque', state: 'processing', stage: 'brief' }] })
  })
  renderExpanded(<AdminBlog onExpired={vi.fn()} />)
  await act(async () => vi.advanceTimersByTimeAsync(800))
  await act(async () => vi.advanceTimersByTimeAsync(10000))
  expect(calls).toBe(2)
  await act(async () => vi.advanceTimersByTimeAsync(11000))
  expect(queueSignal.aborted).toBe(false)
  expect(calls).toBe(2)
  await act(async () => finish({ status: 'ready', items: [{ id: 'job', idea: 'Un paseo por el bosque', state: 'processing', stage: 'brief' }] }))
  await act(async () => vi.advanceTimersByTimeAsync(800))
  await act(async () => vi.advanceTimersByTimeAsync(10000))
  expect(calls).toBe(3)
})

function renderExpanded(element) {
  const view = render(element)
  view.container.querySelectorAll('[data-module-trigger]').forEach(button => fireEvent.click(button))
  return view
}

it('shows compact modules and quick actions initially, then opens the selected task without losing the idea', async () => {
  vi.useFakeTimers()
  adminRequest.mockResolvedValue({ status: 'ready', items: [] })
  const view = render(<AdminBlog onExpired={vi.fn()} />)
  await act(async () => vi.advanceTimersByTimeAsync(800))
  const modules = [...view.container.querySelectorAll('.admin-module')]
  expect(modules).toHaveLength(5)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Nuevo artículo manual' })).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Crear con IA' }))
  expect(screen.getByRole('dialog', {name:'Crear con IA'})).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Tu idea'), { target: { value: 'Una idea que conservar' } })
  fireEvent.click(screen.getByRole('button', {name:'Cerrar ventana'}))
  fireEvent.click(screen.getByRole('button', { name: 'Crear con IA' }))
  expect(screen.getByLabelText('Tu idea')).toHaveValue('Una idea que conservar')
  fireEvent.click(screen.getByRole('button', { name: 'Nuevo artículo manual' }))
  expect(screen.getByRole('dialog', {name:'Nuevo artículo'})).toBeInTheDocument()
  expect(screen.getByLabelText('Título')).toBeVisible()
})

it('preserves an unsaved manual article when closing by backdrop and resuming the editor', async () => {
  vi.useFakeTimers()
  adminRequest.mockResolvedValue({status:'ready',items:[]})
  render(<AdminBlog onExpired={vi.fn()}/>)
  await act(async()=>vi.advanceTimersByTimeAsync(800))
  fireEvent.click(screen.getByRole('button',{name:'Nuevo artículo manual'}))
  fireEvent.change(screen.getByLabelText('Título'),{target:{value:'Un borrador que conservar'}})
  fireEvent.click(screen.getByRole('dialog',{name:'Nuevo artículo'}))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'Continuar edición'}))
  expect(screen.getByLabelText('Título')).toHaveValue('Un borrador que conservar')
  expect(adminRequest.mock.calls.some(([payload])=>payload.action==='create')).toBe(false)
})

it('finishes a pending save after the editor closes without aborting or submitting it twice', async () => {
  vi.useFakeTimers()
  let finish, saveSignal
  adminRequest.mockImplementation((payload, signal) => {
    if(payload.action==='create') {
      saveSignal=signal
      return new Promise(resolve=>{finish=()=>resolve({status:'ready',article:{id:payload.values.id,state:'draft',version:1,document:payload.values.document}})})
    }
    return Promise.resolve({status:'ready',items:[]})
  })
  render(<AdminBlog onExpired={vi.fn()}/>)
  await act(async()=>vi.advanceTimersByTimeAsync(800))
  fireEvent.click(screen.getByRole('button',{name:'Nuevo artículo manual'}))
  fireEvent.change(screen.getByLabelText('Título'),{target:{value:'Guardado en curso'}})
  fireEvent.click(screen.getByRole('button',{name:'Guardar borrador'}))
  await act(async()=>Promise.resolve())
  fireEvent.click(screen.getByRole('button',{name:'Cerrar artículo'}))
  expect(saveSignal.aborted).toBe(false)
  await act(async()=>finish())
  await act(async()=>vi.advanceTimersByTimeAsync(800))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'Continuar edición'}))
  expect(screen.getByLabelText('Título')).toHaveValue('Guardado en curso')
  expect(adminRequest.mock.calls.filter(([payload])=>payload.action==='create')).toHaveLength(1)
})
