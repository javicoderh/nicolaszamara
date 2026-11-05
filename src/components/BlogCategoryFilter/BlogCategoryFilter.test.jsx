import { act,fireEvent,render,screen } from '@testing-library/react'
import { afterEach,expect,it,vi } from 'vitest'
import BlogCategoryFilter from './BlogCategoryFilter.jsx'
import BlogCategoryFilterSkeleton from './BlogCategoryFilterSkeleton.jsx'
import { readBlog } from '../../services/blogService.js'
vi.mock('../../services/blogService.js',()=>({readBlog:vi.fn()}))
afterEach(()=>vi.useRealTimers())
it('uses persisted category labels and real URLs',async()=>{vi.useFakeTimers();const onSelect=vi.fn();readBlog.mockResolvedValue({items:[{id:'naturaleza',name:'Vida natural'}]});render(<BlogCategoryFilter selected="" onSelect={onSelect}/>);await act(async()=>vi.advanceTimersByTimeAsync(800));const link=screen.getByRole('link',{name:'Vida natural'});expect(link).toHaveAttribute('href','/blog?category=naturaleza');fireEvent.click(link,{button:0});expect(onSelect).toHaveBeenCalledWith('naturaleza')})
it('shows its skeleton immediately',()=>{render(<BlogCategoryFilterSkeleton/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})
