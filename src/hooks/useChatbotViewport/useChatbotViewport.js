import { useEffect } from 'react'

// The mobile keyboard can shrink the visual viewport without changing 100dvh.
export function useChatbotViewport(ref, active) {
  useEffect(() => {
    const viewport = window.visualViewport
    const node = ref.current
    if (!active || !viewport || !node) return
    const update = () => {
      node.style.setProperty('--chat-viewport-height', `${viewport.height}px`)
      node.style.setProperty('--chat-viewport-bottom', `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`)
      node.toggleAttribute('data-compact', viewport.height < 600)
    }
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      node.style.removeProperty('--chat-viewport-height')
      node.style.removeProperty('--chat-viewport-bottom')
      node.removeAttribute('data-compact')
    }
  }, [ref, active])
}
