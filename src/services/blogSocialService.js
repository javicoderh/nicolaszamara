export class BlogSocialError extends Error {constructor(status){super(status);this.status=status}}
export async function readArticleSocial(articleId,page=1,signal){
 const response=await fetch(`/api/blog_engagement?${new URLSearchParams({articleId,page:String(page)})}`,{signal,credentials:'same-origin',cache:'no-store'})
 const result=await response.json();if(!response.ok)throw new BlogSocialError(result.status||'unavailable');return result
}
export async function writeArticleSocial(articleId,action,values,signal){
 const response=await fetch('/api/blog_engagement',{method:'POST',signal,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-Blog-Request':'1'},body:JSON.stringify({articleId,action,...values})})
 const result=await response.json();if(!response.ok)throw new BlogSocialError(result.status||'unavailable');return result
}
export function socialError(error){return ({rate_limited:'Has realizado varias acciones seguidas. Vuelve a intentarlo más tarde.',not_found:'Este artículo ya no está disponible para recibir interacciones.',conflict:'Este comentario ya fue recibido. Actualiza la conversación para comprobarlo.',invalid:'Revisa el nombre y el comentario.'})[error?.status]||'No pudimos completar la acción. Conservamos tu comentario para reintentar.'}
