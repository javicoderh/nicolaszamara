import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import BlogPage from './BlogPage.jsx'
import BlogPageSkeleton from './BlogPageSkeleton.jsx'
import { readBlog } from '../../services/blogService.js'
vi.mock('../../services/blogService.js', () => ({ readBlog: vi.fn() }))
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/') })
it('reveals a remote result after completion plus 800ms', async () => {
  vi.useFakeTimers()
  let resolve
  readBlog.mockReturnValue(new Promise((done) => { resolve = done }))
  render(<BlogPage location={{ pathname: '/blog', search: '' }} />)
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); resolve({ status: 'ready', items: [], total: 0 }) })
  await act(async () => vi.advanceTimersByTimeAsync(799))
  expect(screen.getByLabelText('Cargando lecturas')).toBeInTheDocument()
  await act(async () => vi.advanceTimersByTimeAsync(1))
  expect(screen.getByText('Estamos preparando nuevas lecturas.')).toBeInTheDocument()
})
it('opens primary clicks with a background location and a real link', async () => {
  vi.useFakeTimers()
  const item = { id: '1', slug: 'un-bosque', title: 'Un bosque', category: 'naturaleza', summary: 'Observación', readingMinutes: 3 }
  render(<BlogPage location={{ pathname: '/blog', search: '' }} initialBlog={{ path: '/blog', search: '', status: 'ready', items: [item], total: 1 }} />)
  await act(async () => vi.advanceTimersByTimeAsync(800))
  const link = screen.getByRole('link', { name: /Un bosque/ })
  expect(link).toHaveAttribute('href', '/blog/un-bosque')
  fireEvent.click(link, { button: 0 })
  expect(window.history.state.blogBackground).toBe('/blog')
})
it('offers an accessible skeleton', () => { render(<BlogPageSkeleton />); expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true') })
function modalFixture(reduced=false){
 vi.useFakeTimers();vi.spyOn(window,'scrollTo').mockImplementation(()=>{})
 vi.stubGlobal('matchMedia',vi.fn(()=>({matches:reduced})))
 Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:function(){this.open=true}})
 Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:function(){this.open=false}})
 readBlog.mockResolvedValue({status:'ready',items:[]})
 return render(<BlogPage location={{pathname:'/blog/bosque',search:'',state:{blogBackground:'/blog',blogDepth:2,scroll:200}}}/> )
}
it('keeps the dialog active during exit and closes to its recorded background depth',async()=>{
 const go=vi.spyOn(window.history,'go').mockImplementation(()=>{});const {unmount}=modalFixture()
 const dialog=screen.getByRole('dialog');expect(document.body.style.overflow).toBe('hidden')
 fireEvent(dialog,new Event('cancel',{cancelable:true}));expect(dialog).toHaveClass('blog-reader--exiting')
 await act(async()=>vi.advanceTimersByTimeAsync(179));expect(go).not.toHaveBeenCalled()
 await act(async()=>vi.advanceTimersByTimeAsync(1));expect(go).toHaveBeenCalledWith(-2)
 unmount();expect(document.body.style.overflow).toBe('')
})
it('cancels a scheduled close on unmount',async()=>{
 const go=vi.spyOn(window.history,'go').mockImplementation(()=>{});const {unmount}=modalFixture()
 fireEvent(screen.getByRole('dialog'),new Event('cancel',{cancelable:true}));unmount()
 await act(async()=>vi.advanceTimersByTimeAsync(1000));expect(go).not.toHaveBeenCalled()
})
it('honors reduced motion and returns focus when the reader unmounts',()=>{
 const origin=document.createElement('button');origin.textContent='Origen';document.body.append(origin);origin.focus()
 const go=vi.spyOn(window.history,'go').mockImplementation(()=>{});const {unmount}=modalFixture(true)
 fireEvent(screen.getByRole('dialog'),new Event('cancel',{cancelable:true}));expect(go).toHaveBeenCalledWith(-2)
 unmount();expect(document.activeElement).toBe(origin);origin.remove()
})
it('keeps the filtered background grid intact while an article is open',async()=>{
 const {unmount}=modalFixture();unmount()
 readBlog.mockImplementation(async({mode})=>mode==='catalog'?{items:[{id:'naturaleza',name:'Naturaleza'}]}:{status:'ready',items:[]})
 const item={id:'a',slug:'bosque',title:'Bosque',category:'naturaleza',summary:'Una pausa',readingMinutes:2}
 const initialBlog={path:'/blog',search:'?category=naturaleza&page=2',status:'ready',items:[item],total:25}
 const {rerender,container}=render(<BlogPage location={{pathname:'/blog',search:initialBlog.search}} initialBlog={initialBlog}/>);await act(async()=>vi.advanceTimersByTimeAsync(800))
 const card=container.querySelector('.blog-card')
 rerender(<BlogPage location={{pathname:'/blog/bosque',search:'',state:{blogBackground:'/blog?category=naturaleza&page=2',blogDepth:1}}} initialBlog={initialBlog}/>)
 expect(container.querySelector('.blog-featured')).toBeNull();expect(container.querySelector('.blog-card')).toBe(card)
 expect(container.querySelector('.blog-pagination')).toHaveTextContent('Página 2')
})
