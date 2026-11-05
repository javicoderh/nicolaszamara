import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as pause } from 'node:timers/promises'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Start the API first: a Vite-only process cannot serve the application's forms.
// Direct executables (no npm shell children) make shutdown reliable on Windows.
export async function startDevelopment({
  root = projectRoot, spawnChild = spawn, exists = existsSync, request = fetch,
  wait = pause, now = Date.now, apiOnly = false,
  log = console.log, report = console.error, fail = () => { process.exitCode = 1 },
} = {}) {
  const children = []
  let stopped = false
  function stop() {
    if (stopped) return
    stopped = true
    for (const child of children) if (child.exitCode == null && !child.killed) child.kill()
  }
  function failed(message) {
    if (stopped) return
    report(message)
    stop()
    fail()
  }
  function launch(command, args, label) {
    const child = spawnChild(command, args, { cwd: root, stdio: 'inherit', windowsHide: true })
    children.push(child)
    child.on('error', () => failed(`No se pudo iniciar ${label}. Comprueba la instalación y los puertos disponibles.`))
    child.on('exit', () => failed(`${label} se cerró. Se detuvo el desarrollo para evitar errores de conexión con /api.`))
    return child
  }
  const localPython = join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
  launch(exists(localPython) ? localPython : 'python', ['-u', '-m', 'backend.dev_server'], 'la API Python')
  const started = now()
  let ready = false
  let blogGenerationEnabled = false
  while (!stopped && now() - started < 15000) {
    try {
      const response = await request('http://127.0.0.1:3001/api/health', { signal: AbortSignal.timeout(1000) })
      if (response.ok) {
        const health = await response.json()
        if (health.status === 'ready') { ready = true; blogGenerationEnabled = health.blogGenerationEnabled === true; break }
      }
    } catch { /* The API may still be importing its modules. */ }
    await wait(250)
  }
  if (!stopped && !ready) failed('La API no está disponible en 127.0.0.1:3001. Revisa Python y si el puerto ya está ocupado.')
  if (!stopped && ready) {
    log('API lista en http://127.0.0.1:3001. Las rutas /api se atenderán desde el mismo origen de Vite.')
    if (blogGenerationEnabled) {
      launch(exists(localPython) ? localPython : 'python', ['-u', '-m', 'scripts.blog_worker_local'], 'el worker editorial')
      log('Worker editorial activo: procesará los encargos API del blog. Codex conserva su motor independiente.')
    }
    if (!apiOnly) launch(process.execPath, [join(root, 'node_modules/vite/bin/vite.js')], 'Vite')
  }
  return { stop }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Register before startup so Ctrl+C also works while waiting for Python.
  const startup = startDevelopment({ apiOnly: process.argv.includes('--api-only') })
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void startup.then(({ stop }) => stop()) })
}
