import { useAdminQuery } from '../../hooks/useAdminQuery/useAdminQuery.js'
import { readBlog } from '../../services/blogService.js'
import BlogCategoryFilterSkeleton from './BlogCategoryFilterSkeleton.jsx'
import './BlogCategoryFilter.css'
const load=signal=>readBlog({mode:'catalog'},signal)
export default function BlogCategoryFilter({ selected, onSelect }) {
  const query=useAdminQuery(load)
  function link(event,id){if(event.button||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();onSelect(id)}
  return <nav className="blog-category-filter" aria-label="Temas del blog">{query.pending?<BlogCategoryFilterSkeleton/>:query.error?<div role="status"><p>No pudimos cargar los temas.</p><button onClick={query.reload}>Reintentar temas</button></div>:<>{[{id:'',name:'Todos'},...(query.data?.items||[])].map(item=><a href={item.id?`/blog?category=${encodeURIComponent(item.id)}`:'/blog'} key={item.id} aria-current={selected===item.id?'page':undefined} onClick={event=>link(event,item.id)}>{item.name}</a>)}</>}</nav>
}
