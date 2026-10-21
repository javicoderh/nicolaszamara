import { createContext, useContext } from 'react'
import { siteSettings } from '../../content/siteContent.js'

const SiteContentContext = createContext(siteSettings)

export function SiteContentProvider({ children, value = siteSettings }) {
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}

export function useSiteContent() {
  return useContext(SiteContentContext)
}
