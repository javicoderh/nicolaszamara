import { fireEvent, render, screen } from '@testing-library/react'
import { expect,it,vi } from 'vitest'
import AdminArticleEditorModal from './AdminArticleEditorModal.jsx'
import AdminArticleEditorModalSkeleton from './AdminArticleEditorModalSkeleton.jsx'
it('contains the complete editor in a dialog with its own close action',()=>{
 const close=vi.fn()
 render(<AdminArticleEditorModal open record={{}} draft={{title:'Draft',category:'naturaleza',document:{version:1,blocks:[]}}} categories={{naturaleza:'Naturaleza'}} revisions={[]} onClose={close}/>)
 expect(screen.getByRole('dialog')).toContainElement(screen.getByLabelText('Título'))
 expect(screen.getByRole('dialog')).toContainElement(screen.getByRole('region',{name:'Imagen interior'}))
 fireEvent.click(screen.getByRole('button',{name:'Cerrar artículo'}));expect(close).toHaveBeenCalledOnce()
})
it('provides a loading placeholder',()=>{render(<AdminArticleEditorModalSkeleton/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})
