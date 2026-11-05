import { act,fireEvent,render,screen } from '@testing-library/react'
import { afterEach,beforeEach,expect,it,vi } from 'vitest'
import ArticleEngagement from './ArticleEngagement.jsx'
import ArticleEngagementSkeleton from './ArticleEngagementSkeleton.jsx'
import { readArticleSocial,writeArticleSocial } from '../../services/blogSocialService.js'
vi.mock('../../services/blogSocialService.js',()=>({readArticleSocial:vi.fn(),writeArticleSocial:vi.fn(),socialError:()=> 'No pudimos guardar tu participación.'}))
const article={id:'00000000-0000-4000-8000-000000000001',slug:'bosque',title:'Bosque'}
beforeEach(()=>{vi.useFakeTimers();readArticleSocial.mockResolvedValue({likes:2,liked:false,comments:[],myPending:[],total:0})})
afterEach(()=>{vi.useRealTimers();vi.clearAllMocks()})
const advance=async ms=>act(async()=>vi.advanceTimersByTimeAsync(ms))
it('updates the shared like only after the request and its reveal delay',async()=>{
 writeArticleSocial.mockResolvedValue({likes:3,liked:true});render(<ArticleEngagement article={article}/>);expect(screen.getByRole('button',{name:/Me gusta/})).toBeDisabled()
 await advance(800);fireEvent.click(screen.getByRole('button',{name:/Me gusta/}));await advance(799);expect(screen.getByRole('button',{name:/Me gusta/})).toHaveAttribute('aria-pressed','false')
 await advance(1);expect(screen.getByRole('button',{name:/Me gusta/})).toHaveAttribute('aria-pressed','true');expect(writeArticleSocial).toHaveBeenCalledWith(article.id,'like',{liked:true},expect.any(AbortSignal))
})
it('preserves a failed comment and retries with the same idempotency identifier',async()=>{
 writeArticleSocial.mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue({state:'pending'});render(<ArticleEngagement article={article}/>);await advance(800)
 fireEvent.change(screen.getByLabelText('Nombre público'),{target:{value:'Un lector'}});fireEvent.change(screen.getByLabelText('Tu comentario'),{target:{value:'Gracias por esta lectura.'}})
 fireEvent.click(screen.getByRole('button',{name:'Enviar comentario'}));await advance(800);expect(screen.getByLabelText('Tu comentario')).toHaveValue('Gracias por esta lectura.');expect(screen.getByRole('alert')).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'Enviar comentario'}));await advance(800)
 expect(writeArticleSocial.mock.calls[0][2].id).toBe(writeArticleSocial.mock.calls[1][2].id);expect(screen.getByText('Gracias. Tu comentario quedó pendiente de revisión.')).toBeInTheDocument();expect(screen.getByLabelText('Tu comentario')).toHaveValue('')
})
it('renders approved comments as escaped text',async()=>{
 readArticleSocial.mockResolvedValue({likes:0,comments:[{id:'comment',name:'Lector',body:'<script>alert(1)</script>',createdAt:'2026-11-04T00:00:00Z',mine:false}],myPending:[],total:1})
 render(<ArticleEngagement article={article}/>);await advance(800);expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();expect(document.querySelector('script')).toBeNull();expect(screen.queryByRole('button',{name:'Eliminar mi comentario'})).toBeNull()
})
it('provides an immediate skeleton',()=>{render(<ArticleEngagementSkeleton/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})
