import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import ArticleSeoPanel from './ArticleSeoPanel.jsx'
import ArticleSeoPanelSkeleton from './ArticleSeoPanelSkeleton.jsx'
it('inherits editorial fields in the preview and preserves explicit overrides',()=>{const onChange=vi.fn();const {rerender}=render(<ArticleSeoPanel article={{title:'Bosque',summary:'Una pausa'}} onChange={onChange}/>);expect(within(screen.getByLabelText('Vista orientativa de buscador')).getByText('Bosque')).toBeInTheDocument();rerender(<ArticleSeoPanel article={{title:'Nuevo título',seoTitle:'Mi título SEO'}} onChange={onChange}/>);expect(within(screen.getByLabelText('Vista orientativa de buscador')).getByText('Mi título SEO')).toBeInTheDocument();fireEvent.change(screen.getByLabelText('Título SEO (opcional)'),{target:{value:''}});expect(onChange).toHaveBeenCalledWith('seoTitle','')})
it('provides an accessible skeleton',()=>{render(<ArticleSeoPanelSkeleton/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})
