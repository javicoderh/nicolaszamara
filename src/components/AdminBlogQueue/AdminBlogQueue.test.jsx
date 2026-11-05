import { act,fireEvent,render,screen } from '@testing-library/react'
import { afterEach,expect,it,vi } from 'vitest'
import AdminBlogQueue from './AdminBlogQueue.jsx'
import AdminBlogQueueSkeleton from './AdminBlogQueueSkeleton.jsx'
import {adminRequest} from '../../services/adminService.js'
vi.mock('../../services/adminService.js',()=>({adminRequest:vi.fn(),adminErrorMessage:()=> 'Error de prueba'}))
afterEach(()=>{vi.useRealTimers();vi.clearAllMocks()})
it('allows a saved idea to start without duplicating its identifier',()=>{const run=vi.fn();render(<AdminBlogQueue run={run} query={{data:{items:[{id:'idea-1',idea:'Una pausa en el bosque',engine:'api',saved_idea:true,state:'cancelled'}]}}}/>);fireEvent.click(screen.getByRole('button',{name:'Generar esta idea'}));expect(run).toHaveBeenCalledWith('idea_start',{id:'idea-1'})})
it('links a completed generation directly to its persisted draft',()=>{const run=vi.fn(),onArticle=vi.fn();render(<AdminBlogQueue run={run} onArticle={onArticle} query={{data:{items:[{id:'job',idea:'Bosques',state:'completed',stage:'done',result_id:'article'}]}}}/>);expect(screen.getByText(/Borrador listo para revisar/)).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Abrir borrador'}));expect(run).toHaveBeenCalledWith('detail',{id:'article'},onArticle)})
it('announces queue loading',()=>{render(<AdminBlogQueueSkeleton/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})
it('answers one clarification on the same job',async()=>{
 vi.useFakeTimers()
 adminRequest.mockResolvedValue({job:{id:'same-job',idea:'Un tema',state:'needs_input',engine:'api',artifacts:{question:'¿Qué aspecto del bosque te interesa?'}}})
 const run=vi.fn((operation,values,done)=>{if(operation==='job_detail')done({job:{id:'same-job',idea:'Un tema',state:'needs_input',engine:'api',artifacts:{question:'¿Qué aspecto del bosque te interesa?'}}})})
 render(<AdminBlogQueue run={run} query={{data:{items:[{id:'same-job',idea:'Un tema',state:'needs_input',stage:'brief'}]}}}/>)
 fireEvent.click(screen.getByRole('button',{name:'Ver encargo y ficha'}));await act(async()=>vi.advanceTimersByTimeAsync(800));fireEvent.change(screen.getByLabelText('¿Qué aspecto del bosque te interesa?'),{target:{value:'La observación de las estaciones'}});fireEvent.click(screen.getByRole('button',{name:'Continuar generación'}))
 expect(run).toHaveBeenLastCalledWith('job_reply',{id:'same-job',answer:'La observación de las estaciones'},expect.any(Function));expect(run.mock.calls.some(([operation])=>operation==='job_create')).toBe(false)
})
