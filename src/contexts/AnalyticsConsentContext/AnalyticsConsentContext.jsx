import { createContext, useContext, useState, useSyncExternalStore } from 'react'
import { consentStore } from '../../services/consentService.js'

const AnalyticsConsentContext = createContext(null)

export function AnalyticsConsentProvider({ children, store = consentStore }) {
  const consent = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  function savePreferences(preferences) {
    if (store.save(preferences)) setPreferencesOpen(false)
  }
  return <AnalyticsConsentContext.Provider value={{ consent, visible: preferencesOpen || consent.status === 'unknown',
    openPreferences: () => setPreferencesOpen(true), closePreferences: () => setPreferencesOpen(false), savePreferences }}>
    {children}
  </AnalyticsConsentContext.Provider>
}

export function useAnalyticsConsent() { return useContext(AnalyticsConsentContext) }
