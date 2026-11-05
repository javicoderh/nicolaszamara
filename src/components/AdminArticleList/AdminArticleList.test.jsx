import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import AdminArticleList from './AdminArticleList.jsx'
import AdminArticleListSkeleton from './AdminArticleListSkeleton.jsx'
it('filters by text and moves against the global publication order',()=>{
 const onMove=vi.fn(); render(<AdminArticleList onMove={onMove} items={[{id:'a',title:'Bosque',state:'published',position:0,version:1},{id:'b',title:'Flores',state:'published',position:1,version:2}]}/> )
 fireEvent.change(screen.getByLabelText('Buscar artículos'),{target:{value:'Flores'}})
 expect(screen.queryByText('Bosque')).toBeNull(); fireEvent.click(screen.getByRole('button',{name:'Subir'}))
 expect(onMove).toHaveBeenCalledWith(expect.objectContaining({id:'b',version:2}),0)
})
it('reserves the loading region',()=>{render(<AdminArticleListSkeleton/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})
