import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect,it,vi } from 'vitest'
import AdminModal from './AdminModal.jsx'
import AdminModalSkeleton from './AdminModalSkeleton.jsx'
it('closes by button, backdrop and Escape but not by clicking its contents',()=>{
 const close=vi.fn()
 render(<AdminModal title="Test modal" onClose={close}><p>Content</p></AdminModal>)
 const dialog=screen.getByRole('dialog',{name:'Test modal'})
 fireEvent.click(screen.getByText('Content'));expect(close).not.toHaveBeenCalled()
 fireEvent.click(within(dialog).getByRole('button',{name:'Cerrar ventana'}))
 fireEvent.click(dialog)
 fireEvent(dialog,new Event('cancel',{cancelable:true}))
 expect(close).toHaveBeenCalledTimes(3)
 fireEvent.pointerDown(screen.getByText('Content'))
 fireEvent.click(dialog)
 expect(close).toHaveBeenCalledTimes(3)
})
it('keeps entered content when closed and reopened, and restores focus and scroll lock',()=>{
 const trigger=document.createElement('button');document.body.append(trigger);trigger.focus()
 const {rerender,unmount}=render(<AdminModal title="Test modal" onClose={vi.fn()}><label>Draft<input/></label></AdminModal>)
 fireEvent.change(screen.getByLabelText('Draft'),{target:{value:'Keep me'}})
 expect(document.body.style.overflow).toBe('hidden')
 rerender(<AdminModal title="Test modal" open={false} onClose={vi.fn()}><label>Draft<input/></label></AdminModal>)
 expect(document.body.style.overflow).toBe('');expect(document.activeElement).toBe(trigger)
 rerender(<AdminModal title="Test modal" onClose={vi.fn()}><label>Draft<input/></label></AdminModal>)
 expect(screen.getByLabelText('Draft')).toHaveValue('Keep me')
 unmount();trigger.remove()
})
it('keeps the underlying modal scroll lock when a child modal closes',()=>{
 const {rerender}=render(<><AdminModal title="Parent" onClose={vi.fn()}/><AdminModal title="Child" onClose={vi.fn()}/></>)
 rerender(<><AdminModal title="Parent" onClose={vi.fn()}/><AdminModal title="Child" open={false} onClose={vi.fn()}/></>)
 expect(document.body.style.overflow).toBe('hidden')
})
it('provides its own loading placeholder',()=>{render(<AdminModalSkeleton/>);expect(screen.getByRole('status')).toHaveAttribute('aria-busy','true')})
