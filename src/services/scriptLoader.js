const documents = new WeakMap()

// Exactly one attempt per document/ID, including failure; a blocked provider
// must not trigger an unbounded retry loop on every interaction.
export function loadExternalScript(documentRef, { id, src, timeoutMs = 30000 }) {
  if (!documentRef) return Promise.resolve(false)
  if (!documents.has(documentRef)) documents.set(documentRef, new Map())
  const attempts = documents.get(documentRef)
  if (attempts.has(id)) return attempts.get(id)
  const attempt = new Promise((resolve) => {
    const script = documentRef.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.referrerPolicy = 'strict-origin'
    const finish = (ok) => {
      clearTimeout(timer)
      script.onload = null
      script.onerror = null
      if (!ok) script.remove()
      resolve(ok)
    }
    const timer = setTimeout(() => finish(false), timeoutMs)
    script.onload = () => finish(true)
    script.onerror = () => finish(false)
    documentRef.head.appendChild(script)
  })
  attempts.set(id, attempt)
  return attempt
}
