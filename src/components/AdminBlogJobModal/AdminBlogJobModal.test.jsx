import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect,it,vi } from 'vitest'
import AdminBlogJobModal from './AdminBlogJobModal.jsx'
import AdminBlogJobModalSkeleton from './AdminBlogJobModalSkeleton.jsx'
import { adminRequest } from '../../services/adminService.js'
vi.mock('../../services/adminService.js',()=>({adminRequest:vi.fn(),adminErrorMessage:()=> 'Error al cargar'}))
afterEach(()=>{vi.useRealTimers();vi.clearAllMocks()})
it('loads all job information inside one modal after request plus 800 ms',async()=>{
 vi.useFakeTimers()
 adminRequest.mockResolvedValue({status:'ready',job:{id:'job',idea:'Idea completa',state:'failed',stage:'brief',attempts:1,error_code:'invalid_text:topic:type',brief:{topic:'Un tema'},artifacts:{brief_record:{usage:{costMicroUsd:85794}}}}})
 const close=vi.fn(),run=vi.fn()
 render(<AdminBlogJobModal id="job" onClose={close} run={run}/>)
 expect(screen.getByLabelText('Cargando encargo editorial')).toBeInTheDocument()
 await act(async()=>vi.advanceTimersByTimeAsync(799))
 expect(screen.queryByText('Idea completa')).not.toBeInTheDocument()
 await act(async()=>vi.advanceTimersByTimeAsync(1))
 expect(screen.getByRole('dialog',{name:'Encargo editorial'})).toContainElement(screen.getByText('Idea completa'))
 expect(screen.getByText('Consumo conocido: US$0.0858')).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'Reintentar generación'}))
 expect(run).toHaveBeenCalledWith('job_retry',{id:'job'},expect.any(Function))
 fireEvent.click(screen.getByRole('dialog'));expect(close).toHaveBeenCalledOnce()
})
it('shows a delayed load error and a retry in the same dialog',async()=>{
 vi.useFakeTimers();adminRequest.mockRejectedValue(new Error('offline'))
 render(<AdminBlogJobModal id="job" onClose={vi.fn()}/>)
 await act(async()=>vi.advanceTimersByTimeAsync(800))
 expect(screen.getByRole('alert')).toHaveTextContent('Error al cargar')
 fireEvent.click(screen.getByRole('button',{name:'Reintentar detalle del encargo'}))
 expect(screen.getByLabelText('Cargando encargo editorial')).toBeInTheDocument()
})
it('provides its own loading placeholder',()=>{render(<AdminBlogJobModalSkeleton/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})
it('revalidates a saved response rather than requesting a new generation',async()=>{
 vi.useFakeTimers();adminRequest.mockResolvedValue({job:{id:'job',idea:'Una idea',state:'failed',stage:'brief',engine:'api',provider_response_id:'resp_saved',attempts:3,artifacts:{}}})
 const run=vi.fn()
 render(<AdminBlogJobModal id="job" onClose={vi.fn()} run={run}/>)
 await act(async()=>vi.advanceTimersByTimeAsync(800))
 fireEvent.click(screen.getByRole('button',{name:'Revisar respuesta guardada'}))
 expect(run).toHaveBeenCalledWith('job_revalidate',{id:'job'},expect.any(Function))
 expect(screen.getByRole('button',{name:'Reintentar generación'})).toBeDisabled()
})
