const KEY='nz-blog-saved-v1'
const EMPTY=Object.freeze([])
function normalize(article){
 if(!article||typeof article.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(article.id)||typeof article.slug!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)||article.slug.length>100||typeof article.title!=='string'||!article.title.trim()||article.title.length>160)return null
 return {id:article.id,slug:article.slug,title:article.title,category:typeof article.category==='string'?article.category.slice(0,100):'',savedAt:typeof article.savedAt==='string'?article.savedAt:new Date().toISOString()}
}
export function createSavedArticlesStore(storage=()=>window.localStorage){
 let snapshot=EMPTY,loaded=false
 const listeners=new Set()
 function read(){
  try{const raw=storage().getItem(KEY);if(raw?.length>100000)return EMPTY;const values=JSON.parse(raw||'[]');if(!Array.isArray(values))return EMPTY;const seen=new Set();return values.slice(0,100).map(normalize).filter(item=>{if(!item||seen.has(item.id))return false;seen.add(item.id);return true})}catch{return EMPTY}
 }
 function notify(){for(const listener of listeners)listener()}
 function getSnapshot(){if(!loaded){snapshot=read();loaded=true}return snapshot}
 function write(values){try{storage().setItem(KEY,JSON.stringify(values));snapshot=values;loaded=true;notify();return true}catch{return false}}
 return {
  getSnapshot,getServerSnapshot:()=>EMPTY,
  subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)},
  toggle(article){const normalized=normalize(article);if(!normalized)return false;const current=getSnapshot();if(current.some(item=>item.id===article.id))return write(current.filter(item=>item.id!==article.id));if(current.length>=100)return false;return write([normalized,...current])},
  remove(id){return write(getSnapshot().filter(item=>item.id!==id))},
  reload(){snapshot=read();loaded=true;notify()},
 }
}
export const savedArticlesStore=createSavedArticlesStore()
if(typeof window!=='undefined')window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null)savedArticlesStore.reload()})
