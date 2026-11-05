import { afterEach,expect,it,vi } from 'vitest'
import { readBlog } from './blogService.js'
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals()})
it('preserves not-found as a public state instead of masking an origin failure',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,json:async()=>({status:'not_found'})}));expect(await readBlog({slug:'no-existe'})).toEqual({status:'not_found'})
 fetch.mockResolvedValue({ok:false,json:async()=>({status:'unavailable'})});await expect(readBlog()).rejects.toThrow('unavailable')
})
it('times out a stalled request and aborts the transport',async()=>{
 vi.useFakeTimers();let observed
 vi.stubGlobal('fetch',vi.fn((url,{signal})=>new Promise((resolve,reject)=>{observed=signal;signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')))})))
 const outcome=readBlog().catch(error=>error.name);await vi.advanceTimersByTimeAsync(15000);expect(await outcome).toBe('AbortError');expect(observed.aborted).toBe(true)
})
it('links navigation cancellation to the actual fetch signal',async()=>{
 const controller=new AbortController();let observed
 vi.stubGlobal('fetch',vi.fn((url,{signal})=>new Promise((resolve,reject)=>{observed=signal;signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')))})))
 const outcome=readBlog({slug:'bosque'},controller.signal).catch(error=>error.name);controller.abort();expect(await outcome).toBe('AbortError');expect(observed.aborted).toBe(true)
})
