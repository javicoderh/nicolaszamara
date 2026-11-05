import { act,fireEvent,render,screen } from '@testing-library/react'
import { afterEach,expect,it,vi } from 'vitest'
import AdminBlogModeration from './AdminBlogModeration.jsx'
import AdminBlogModerationSkeleton from './AdminBlogModerationSkeleton.jsx'
import { adminRequest } from '../../services/adminService.js'
vi.mock('../../services/adminService.js',()=>({adminRequest:vi.fn(),adminErrorMessage:()=> 'No disponible'}))
afterEach(()=>{vi.useRealTimers();vi.clearAllMocks()})
it('approves a pending comment through the authenticated admin endpoint',async()=>{
 vi.useFakeTimers();adminRequest.mockImplementation(async({action})=>action==='comments'?{items:[{id:'comment-id',article_title:'Bosque',display_name:'Lector',body:'Gracias por compartir',state:'pending',created_at:'2026-11-04T00:00:00Z'}]}:{status:'ready'})
 render(<AdminBlogModeration/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true');await act(async()=>vi.advanceTimersByTimeAsync(800));fireEvent.click(screen.getByRole('button',{name:'Aprobar comentario'}));await act(async()=>vi.advanceTimersByTimeAsync(800));expect(adminRequest).toHaveBeenCalledWith({operation:'blog',action:'comment_moderate',values:{id:'comment-id',state:'approved'}},expect.any(AbortSignal));expect(screen.getByText('Moderación guardada.')).toBeInTheDocument()
})
it('provides a moderation skeleton',()=>{render(<AdminBlogModerationSkeleton/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})
