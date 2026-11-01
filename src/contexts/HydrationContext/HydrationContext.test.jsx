import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HydrationProvider, useHydrated } from './HydrationContext.jsx'

function Consumer() { return <button disabled={!useHydrated()}>Submit</button> }
describe('HydrationProvider', () => {
  it('keeps static forms inactive and enables client handlers after mounting', () => {
    expect(renderToString(<HydrationProvider><Consumer /></HydrationProvider>)).toContain('disabled=""')
    render(<HydrationProvider><Consumer /></HydrationProvider>)
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()
  })
})
