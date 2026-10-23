import { act, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useChatbotModal } from './useChatbotModal.js'

afterEach(() => { vi.restoreAllMocks(); document.body.removeAttribute('style'); document.documentElement.removeAttribute('style') })

function fixture() {
  const shell = document.createElement('div')
  const panel = document.createElement('section')
  panel.tabIndex = -1
  const launcher = document.createElement('button')
  shell.append(panel, launcher)
  document.body.append(shell)
  return { shell, panel, launcher, props: { shellRef: { current: shell }, panelRef: { current: panel }, launcherRef: { current: launcher }, onClose: vi.fn() } }
}

it('isolates the page, contains focus and restores previous styles and inert attributes on cleanup', () => {
  const { shell, panel, launcher, props } = fixture()
  const outside = document.createElement('button')
  const alreadyInert = document.createElement('div')
  alreadyInert.setAttribute('inert', 'inert')
  document.body.append(outside, alreadyInert)
  document.body.style.setProperty('overflow', 'auto')
  document.body.style.paddingRight = '7px'
  document.documentElement.style.overflow = 'scroll'
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(window.innerWidth - 15)
  const { unmount } = renderHook(() => useChatbotModal({ ...props, active: true }))
  expect(panel).toHaveFocus()
  expect(outside).toHaveAttribute('inert')
  expect(document.body.style.paddingRight).toBe('22px')
  act(() => outside.focus())
  expect(panel).toHaveFocus()
  fireEvent.keyDown(panel, { key: 'Tab' })
  expect(panel).toHaveFocus()
  fireEvent.keyDown(panel, { key: 'Escape' })
  expect(props.onClose).toHaveBeenCalledOnce()
  unmount()
  expect(outside).not.toHaveAttribute('inert')
  expect(alreadyInert.getAttribute('inert')).toBe('inert')
  expect(document.body.style.overflow).toBe('auto')
  expect(document.body.style.paddingRight).toBe('7px')
  expect(document.documentElement.style.overflow).toBe('scroll')
  expect(launcher).toHaveFocus()
  shell.remove(); outside.remove(); alreadyInert.remove()
})

it('does not lock the page for an embedded or closed assistant', () => {
  const { shell, props } = fixture()
  const { unmount } = renderHook(() => useChatbotModal({ ...props, active: false }))
  expect(document.body.style.overflow).toBe('')
  unmount()
  shell.remove()
})
