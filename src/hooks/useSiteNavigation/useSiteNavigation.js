import { useEffect, useState } from 'react'

const locationSnapshot = () => ({ pathname: window.location.pathname, search: window.location.search, hash: window.location.hash, state: window.history.state })
function initialLocation(){
  const snapshot=locationSnapshot()
  // History state survives reloads; a fresh document is a standalone reading.
  if(/^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(snapshot.pathname)&&snapshot.state?.blogBackground){
    const state={...snapshot.state};delete state.blogBackground;delete state.blogDepth;delete state.scroll
    window.history.replaceState(state,'',window.location.href)
    return {...snapshot,state}
  }
  return snapshot
}

// Keep ordinary anchors (new tabs, downloads and external destinations) native.
export function useSiteNavigation(paths, initialPath = '/', initialSearch = '') {
  const [location, setLocation] = useState(() => typeof window === 'undefined' ? { pathname: initialPath, search: initialSearch, hash: '', state: null } : initialLocation())

  useEffect(() => {
    const sync = () => setLocation(locationSnapshot())
    function navigate(event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = event.target.closest?.('a[href]')
      if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download') || anchor.getAttribute('href').startsWith('#')) return
      const url = new URL(anchor.href, window.location.href)
      const path = url.pathname.replace(/\/+$/, '') || '/'
      if (url.origin !== window.location.origin || (!paths.includes(path) && !/^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path))) return
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
