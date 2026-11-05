import { copyFile, mkdir, cp } from 'node:fs/promises'
await mkdir('server/generated', { recursive: true })
await copyFile('.preview/marketing-ssr/entry-server.js', 'server/generated/entry-server.js')
await cp('.preview/marketing-ssr/assets','server/generated/assets',{recursive:true})
console.log('Blog runtime: shared React renderer packaged.')
