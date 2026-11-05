// @vitest-environment node
import { EventEmitter } from 'node:events'
import { expect, it, vi } from 'vitest'
import { startDevelopment } from './dev.mjs'

function setup() {
  const children = []
  const spawnChild = vi.fn(() => {
    const child = new EventEmitter()
    child.kill = vi.fn(() => { child.killed = true; child.emit('exit', 0) })
    children.push(child)
    return child
  })
  return { children, spawnChild }
}

it('waits for the API before starting Vite and stops both children together', async () => {
  const { children, spawnChild } = setup()
  let finish
  const request = vi.fn(() => new Promise((resolve) => { finish = resolve }))
  const running = startDevelopment({ spawnChild, exists: () => true, request, log: vi.fn() })
  expect(spawnChild).toHaveBeenCalledTimes(1)
  finish({ ok: true, json: async () => ({ status: 'ready' }) })
  const { stop } = await running
  expect(spawnChild).toHaveBeenCalledTimes(2)
  expect(spawnChild.mock.calls[0][1]).toEqual(['-u', '-m', 'backend.dev_server'])
  expect(spawnChild.mock.calls[1][1][0]).toContain('vite')
  stop()
  expect(children.every((child) => child.kill.mock.calls.length === 1)).toBe(true)
})

it('reports an API startup failure without leaving Vite running', async () => {
  const { children, spawnChild } = setup()
  const report = vi.fn(), fail = vi.fn()
  const pending = startDevelopment({ spawnChild, exists: () => false, request: async () => {
    children[0].emit('error', new Error('ENOENT'))
    throw Error('not ready')
  }, wait: async () => {}, report, fail })
  await pending
  expect(spawnChild).toHaveBeenCalledTimes(1)
  expect(report).toHaveBeenCalledWith(expect.stringContaining('No se pudo iniciar'))
  expect(fail).toHaveBeenCalledOnce()
})

it('times out an unreachable API and shuts down its process', async () => {
  const { children, spawnChild } = setup()
  let clock = 0
  const fail = vi.fn()
  await startDevelopment({ spawnChild, exists: () => false, request: async () => { throw Error('unreachable') },
    now: () => clock, wait: async (delay) => { clock += delay }, report: vi.fn(), fail })
  expect(spawnChild).toHaveBeenCalledTimes(1)
  expect(children[0].kill).toHaveBeenCalledOnce()
  expect(fail).toHaveBeenCalledOnce()
})

it('supports an API-only session and stops the other process after a runtime failure', async () => {
  const { children, spawnChild } = setup()
  const fail = vi.fn()
  const { stop } = await startDevelopment({ spawnChild, exists: () => false, apiOnly: true,
    request: async () => ({ ok: true, json: async () => ({ status: 'ready' }) }), log: vi.fn(), report: vi.fn(), fail })
  expect(spawnChild).toHaveBeenCalledTimes(1)
  children[0].exitCode = 1
  children[0].emit('exit', 1)
  expect(fail).toHaveBeenCalledOnce()
  stop()
})
it('starts the editorial worker only when the local API reports generation enabled',async()=>{
  const {children,spawnChild}=setup()
  const {stop}=await startDevelopment({spawnChild,exists:()=>true,request:async()=>({ok:true,json:async()=>({status:'ready',blogGenerationEnabled:true})}),log:vi.fn()})
  expect(spawnChild).toHaveBeenCalledTimes(3)
  expect(spawnChild.mock.calls[1][1]).toEqual(['-u','-m','scripts.blog_worker_local'])
  expect(spawnChild.mock.calls[2][1][0]).toContain('vite')
  stop();expect(children.every(child=>child.kill.mock.calls.length===1)).toBe(true)
})
