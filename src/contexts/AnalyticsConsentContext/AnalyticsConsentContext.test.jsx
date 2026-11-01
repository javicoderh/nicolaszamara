import { StrictMode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnalyticsConsentProvider, useAnalyticsConsent } from './AnalyticsConsentContext.jsx'
import { createConsentStore } from '../../services/consentService.js'

function Consumer() {
  const value = useAnalyticsConsent()
  return <><p>{value.consent.status}:{value.visible ? 'visible' : 'hidden'}</p>
    <button onClick={() => value.savePreferences({ analytics: false, experience: false })}>Reject</button>
    <button onClick={value.openPreferences}>Open</button><button onClick={value.closePreferences}>Close</button></>
}
describe('AnalyticsConsentProvider', () => {
  it('shares preference changes and permits reopening under StrictMode', () => {
    const store = createConsentStore({ storage: null })
    const { unmount } = render(<StrictMode><AnalyticsConsentProvider store={store}><Consumer /></AnalyticsConsentProvider></StrictMode>)
    expect(screen.getByText('unknown:visible')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Reject'))
    expect(screen.getByText('rejected:hidden')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Open'))
    expect(screen.getByText('rejected:visible')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Close'))
    expect(screen.getByText('rejected:hidden')).toBeInTheDocument()
    unmount()
    expect(store.save({ analytics: true, experience: true })).toBe(true)
  })
})
