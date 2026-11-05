import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect,it } from 'vitest'
import AdminModule, {openAdminModule} from './AdminModule.jsx'
import AdminModuleSkeleton from './AdminModuleSkeleton.jsx'
it('opens a module in a dialog and preserves its fields after closing',()=>{
 render(<AdminModule id="test-module" title="Module" description="A task"><label>Draft<input/></label></AdminModule>)
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:/Module/}))
 fireEvent.change(screen.getByLabelText('Draft'),{target:{value:'Keep me'}})
 fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Cerrar ventana'}))
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:/Module/}))
 expect(screen.getByLabelText('Draft')).toHaveValue('Keep me')
})
it('announces its loading placeholder',()=>{render(<AdminModuleSkeleton/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})
