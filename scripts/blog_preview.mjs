// Local visual fixture only. No database, credentials, inference or publication.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { renderRoute } from '../server/generated/entry-server.js'
const root=resolve('dist'),port=4174
const article={id:'00000000-0000-4000-8000-000000000001',slug:'muestra-visual',title:'El tiempo que encuentra un sendero',summary:'Muestra local de diseño. Este contenido no pertenece al catálogo publicado.',author:'Vista previa editorial',category:'naturaleza',categoryLabel:'Naturaleza',readingMinutes:3,cover:'/photos/contemplando-1200.jpg',coverAlt:'Lago entre montañas',bodyImage:{src:'/photos/presentacion-botanica-1280.jpg',alt:'Flor amarilla en una presentación de botánica',caption:'Muestra de fotografía interior',alignment:'right'},sources:[],document:{version:1,blocks:Array.from({length:8},(_,i)=>i===0?{type:'heading',level:2,text:'Una pausa para observar'}:{type:'paragraph',text:'Esta es una muestra visual privada para revisar el ritmo de lectura. El sendero, la luz y las hojas acompañan un texto de prueba. Aquí comprobamos el ancho de los párrafos, su convivencia con una segunda imagen y la comodidad de la lectura en pantallas de distintos tamaños.'})}}
const articles=Array.from({length:5},(_,i)=>({...article,id:`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,slug:i?`muestra-${i}`:article.slug,title:i?`Lectura de prueba ${i+1}`:article.title,position:i,featured:i===0}))
const categories=Object.entries({naturaleza:'Naturaleza',terapias:'Terapias','flores-de-bach':'Flores de Bach',formacion:'Formación'}).map(([id,name],position)=>({id,name,position}))
const json=(res,data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1')
  if(url.pathname==='/api/blog_engagement')return json(res,req.method==='GET'?{status:'ready',likes:6,liked:false,total:1,hasMore:false,comments:[{id:'preview-comment',name:'Lectura de muestra',body:'Un espacio para continuar la conversación. Comentario de prueba del preview local.',createdAt:'2026-11-04T00:00:00Z',mine:false}],myPending:[]}:{status:'preview_read_only'},req.method==='GET'?200:400)
  if(url.pathname==='/api/blog')return json(res,url.searchParams.get('mode')==='catalog'?{status:'ready',items:categories}:url.searchParams.get('mode')==='related'?{status:'ready',items:articles.slice(1,3)}:url.searchParams.get('slug')?{status:'ready',article:{...article,slug:url.searchParams.get('slug')}}:{status:'ready',items:articles,total:articles.length})
  if(url.pathname==='/api/admin'){
   let input='';for await(const part of req)input+=part;if(input.length>300000)return json(res,{status:'invalid'},413)
   const body=JSON.parse(input||'{}')
   if(body.operation==='session')return json(res,{status:'authenticated',username:'Vista previa local'})
   if(body.operation==='interests')return json(res,{status:'ready',items:[],total:0,summary:{total:0,unread:0,read:0,form:0,chatbot:0}})
   if(body.operation==='blog'&&body.action==='catalog')return json(res,{status:'ready',items:categories})
   if(body.operation==='blog'&&body.action==='generation_info')return json(res,{status:'ready',enabled:false,model:'gpt-6.1-sol',jobLimitUsd:0,dailyLimitUsd:0})
   if(body.operation==='blog'&&body.action==='list')return json(res,{status:'ready',items:[{id:article.id,title:article.title,state:'draft',version:1,position:0,category:'naturaleza',author:article.author}]})
   if(body.operation==='blog'&&body.action==='detail')return json(res,{status:'ready',article:{id:article.id,state:'draft',version:1,document:article},revisions:[]})
   if(body.operation==='blog'&&body.action==='jobs')return json(res,{status:'ready',items:[]})
   return json(res,{status:'preview_read_only'},400)
  }
  if(req.method!=='GET')return json(res,{status:'preview_read_only'},405)
  if(url.pathname==='/'||url.pathname==='/admin'||url.pathname.startsWith('/blog')){
   const path=url.pathname==='/'?'/blog':url.pathname
   const snapshot=path==='/blog'?{status:'ready',items:articles,total:articles.length,path,search:url.search}:{status:'ready',article,path,search:''}
   // Use the build's empty shell, rather than a separately prerendered route.
   const template=await readFile(new URL('../server/generated/template.html',import.meta.url),'utf8')
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'})
   return res.end(template.replace('<div id="root"></div>',()=>`<div id="root">${renderRoute(path,snapshot)}</div>`).replace('</body>',()=>`<script id="blog-snapshot" type="application/json">${JSON.stringify(snapshot).replace(/</g,'\\u003c')}</script></body>`))
  }
  const file=resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+sep))throw new Error()
  res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(await readFile(file))
 }catch{res.writeHead(404);res.end('Not found')}
}).listen(port,'127.0.0.1',()=>console.log(`Visual fixture (read only): http://127.0.0.1:${port}/blog`))
