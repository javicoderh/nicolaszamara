export function currentSourcePath() {
  return typeof window === 'undefined' ? '/' : window.location.pathname.replace(/\/+$/, '') || '/'
}
