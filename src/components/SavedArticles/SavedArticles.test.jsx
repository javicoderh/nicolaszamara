import { fireEvent,render,screen } from '@testing-library/react'
import { expect,it } from 'vitest'
import SavedArticles from './SavedArticles.jsx'
import SavedArticlesSkeleton from './SavedArticlesSkeleton.jsx'
import { createSavedArticlesStore } from '../../services/savedArticlesStore.js'
it('shows access only while this browser has saved articles',()=>{let raw=null;const store=createSavedArticlesStore(()=>({getItem:()=>raw,setItem:(key,value)=>{raw=value}}));const {rerender}=render(<SavedArticles store={store}/>);expect(screen.queryByText(/Guardados/)).toBeNull();store.toggle({id:'00000000-0000-4000-8000-000000000001',slug:'bosque',title:'Bosque'});rerender(<SavedArticles store={store}/>);fireEvent.click(screen.getByText('Guardados (1)'));expect(screen.getByRole('link',{name:'Bosque'})).toHaveAttribute('href','/blog/bosque');fireEvent.click(screen.getByRole('button',{name:'Quitar de guardados: Bosque'}));expect(screen.queryByText(/Guardados/)).toBeNull()})
it('provides its skeleton',()=>{render(<SavedArticlesSkeleton/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})
