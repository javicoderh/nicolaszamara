import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

// jsdom does not implement the native dialog top layer.
if (typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); this.querySelector('[autofocus],button,input')?.focus() }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
}

afterEach(cleanup)
