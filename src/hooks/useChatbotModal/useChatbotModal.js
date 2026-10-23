import { useEffect, useRef } from 'react'

const focusableSelector = 'a[href], button, input, select, textarea, [tabindex]'

export function useChatbotModal({ active, panelRef, shellRef, launcherRef, onClose }) {
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    const panel = panelRef.current
    const shell = shellRef.current
    if (!active || !panel || !shell) return

    const background = [...document.body.children].filter((node) => node !== shell)
      .map((node) => ({ node, inert: node.getAttribute('inert') }))
    const savedStyles = []
    function setStyle(node, property, value) {
      savedStyles.push({ node, property, value: node.style.getPropertyValue(property), priority: node.style.getPropertyPriority(property) })
      node.style.setProperty(property, value)
    }
    const root = document.documentElement
    const gutter = root.clientWidth > 0 ? Math.max(0, window.innerWidth - root.clientWidth) : 0
    if (gutter) setStyle(document.body, 'padding-right', `${(parseFloat(getComputedStyle(document.body).paddingRight) || 0) + gutter}px`)
    setStyle(root, 'overflow', 'hidden')
    setStyle(document.body, 'overflow', 'hidden')
    background.forEach(({ node }) => node.setAttribute('inert', ''))
    panel.focus({ preventScroll: true })

    function containFocus(event) {
      if (!panel.contains(event.target)) panel.focus({ preventScroll: true })
    }
    function keydown(event) {
      if (event.defaultPrevented) return
      if (event.key === 'Escape') { event.preventDefault(); close.current(); return }
      if (event.key !== 'Tab') return
      const controls = [...panel.querySelectorAll(focusableSelector)].filter((node) => {
        const style = getComputedStyle(node)
        return node.tabIndex >= 0 && !node.matches(':disabled') && !node.closest('[hidden], [inert]') && style.display !== 'none' && style.visibility !== 'hidden'
      })
      const first = controls[0], last = controls.at(-1)
      const focused = document.activeElement
      if (!first || !panel.contains(focused) || focused === panel || (event.shiftKey ? focused === first : focused === last)) {
        event.preventDefault()
        ;(event.shiftKey ? last || panel : first || panel).focus({ preventScroll: true })
      }
    }
    document.addEventListener('focusin', containFocus)
    document.addEventListener('keydown', keydown)
    return () => {
      document.removeEventListener('focusin', containFocus)
      document.removeEventListener('keydown', keydown)
      background.forEach(({ node, inert }) => inert === null ? node.removeAttribute('inert') : node.setAttribute('inert', inert))
      savedStyles.reverse().forEach(({ node, property, value, priority }) => value ? node.style.setProperty(property, value, priority) : node.style.removeProperty(property))
      if (launcherRef.current?.isConnected) launcherRef.current.focus({ preventScroll: true })
    }
  }, [active, panelRef, shellRef, launcherRef])
}
