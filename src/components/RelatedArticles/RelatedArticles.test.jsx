import { act, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import RelatedArticles from './RelatedArticles.jsx'
import RelatedArticlesSkeleton from './RelatedArticlesSkeleton.jsx'
import { readBlog } from '../../services/blogService.js'
vi.mock('../../services/blogService.js',()=>({readBlog:vi.fn()}))
afterEach(()=>vi.useRealTimers())
it('loads independently and excludes the current article',async()=>{vi.useFakeTimers();readBlog.mockResolvedValue({items:[{slug:'actual',title:'Actual'},{slug:'otra',title:'Otra lectura'}]});render(<RelatedArticles slug="actual"/>);expect(screen.getByRole('status')).toBeInTheDocument();await act(async()=>vi.advanceTimersByTimeAsync(800));expect(screen.queryByRole('link',{name:/Actual/})).toBeNull();expect(screen.getByRole('link',{name:/Otra lectura/})).toHaveAttribute('href','/blog/otra')})
it('announces its skeleton',()=>{render(<RelatedArticlesSkeleton/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})
