export function publicationIssues(article){
 const required={title:'Título',slug:'URL del artículo',summary:'Introducción',author:'Autor',category:'Categoría',cover:'Imagen de apertura',coverAlt:'Descripción de la imagen de apertura'}
 const issues=Object.entries(required).filter(([key])=>!article[key]?.trim()).map(([,label])=>label)
 if(!article.document?.blocks?.some(block=>(block.text||block.items?.join(' ')||'').trim()))issues.push('Contenido del artículo')
 if(!article.bodyImage?.src)issues.push('Imagen interior')
 if(!article.bodyImage?.alt?.trim())issues.push('Descripción de la imagen interior')
 if(article.cover&&article.cover===article.bodyImage?.src)issues.push('Dos fotografías distintas')
 return issues
}

export function titleSlug(title){return title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100).replace(/-$/,'')}
