import { createContext, useContext, useEffect, useState } from 'react'

// Standalone client components keep their existing behavior. App provides the
// server/client boundary so static forms cannot submit without their handlers.
const HydrationContext = createContext(true)

export function HydrationProvider({ children }) {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(true) }, [])
  return <HydrationContext.Provider value={hydrated}>{children}</HydrationContext.Provider>
}

export function useHydrated() { return useContext(HydrationContext) }
