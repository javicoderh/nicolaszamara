import { render } from '@testing-library/react'
import { expect,it } from 'vitest'
import AdminIcon from './AdminIcon.jsx'
import AdminIconSkeleton from './AdminIconSkeleton.jsx'
it('adds decorative icons without replacing accessible button labels',()=>{const {container}=render(<button><AdminIcon name="inbox"/> Solicitudes</button>);expect(container.querySelector('svg')).toHaveAttribute('aria-hidden','true');expect(container.querySelector('path')).toHaveAttribute('d')})
it('provides a decorative placeholder',()=>{const {container}=render(<AdminIconSkeleton/>);expect(container.firstChild).toHaveAttribute('aria-hidden','true')})
