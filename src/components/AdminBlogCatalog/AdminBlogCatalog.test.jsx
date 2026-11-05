import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import AdminBlogCatalog from './AdminBlogCatalog.jsx'
import AdminBlogCatalogSkeleton from './AdminBlogCatalogSkeleton.jsx'
it('sends a category name without changing its stable identifier',()=>{const onSave=vi.fn();renderExpanded(<AdminBlogCatalog items={[{id:'naturaleza',name:'Naturaleza',position:0}]} onSave={onSave}/>);fireEvent.change(screen.getByLabelText('Nombre de naturaleza'),{target:{value:'Vida natural'}});fireEvent.click(screen.getByRole('button',{name:'Guardar categoría'}));expect(onSave).toHaveBeenCalledWith({id:'naturaleza',name:'Vida natural',position:0})})
it('announces its loading placeholder',()=>{render(<AdminBlogCatalogSkeleton/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})

function renderExpanded(element) {
  const view = render(element)
  view.container.querySelectorAll('[data-module-trigger]').forEach(button => fireEvent.click(button))
  return view
}
