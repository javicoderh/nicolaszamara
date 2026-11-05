import { fireEvent,render,screen } from '@testing-library/react'
import { expect,it } from 'vitest'
import ArticleSaveButton from './ArticleSaveButton.jsx'
import ArticleSaveButtonSkeleton from './ArticleSaveButtonSkeleton.jsx'
import { createSavedArticlesStore } from '../../services/savedArticlesStore.js'
it('toggles a bookmark and announces its current state',()=>{let raw=null;const store=createSavedArticlesStore(()=>({getItem:()=>raw,setItem:(key,value)=>{raw=value}}));render(<ArticleSaveButton article={{id:'00000000-0000-4000-8000-000000000001',slug:'bosque',title:'Bosque'}} store={store}/>);fireEvent.click(screen.getByRole('button',{name:/Guardar artículo/}));expect(screen.getByRole('button',{name:/Guardado en este navegador/})).toHaveAttribute('aria-pressed','true');fireEvent.click(screen.getByRole('button',{name:/Guardado en este navegador/}));expect(screen.getByRole('button',{name:/Guardar artículo/})).toHaveAttribute('aria-pressed','false')})
it('provides a loading placeholder',()=>{render(<ArticleSaveButtonSkeleton/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})
