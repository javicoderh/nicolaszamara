import { useEffect, useState } from 'react'

const locationSnapshot = () => ({ pathname: window.location.pathname, hash: window.location.hash })

// Keep ordinary anchors (new tabs, downloads and external destinations) native.
export function useSiteNavigation(paths) {
  const [location, setLocation] = useState(locationSnapshot)

  useEffect(() => {
    const sync = () => setLocation(locationSnapshot())
    function navigate(event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = event.target.closest?.('a[href]')
      if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download') || anchor.getAttribute('href').startsWith('#')) return
      const url = new URL(anchor.href, window.location.href)
      const path = url.pathname.replace(/\/+$/, '') || '/'
      if (url.origin !== window.location.origin || !paths.includes(path)) return
      event.preventDefault()
      if (url.href === window.location.href) return
      window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`)
      sync()
    }
    document.addEventListener('click', navigate)
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      document.removeEventListener('click', navigate)
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [paths])

  return location
}
