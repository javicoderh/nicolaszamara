import './ArticleEngagementSkeleton.css'
export default function ArticleEngagementSkeleton({label='Cargando conversación'}){return <div className="article-engagement-skeleton" role="status" aria-label={label} aria-busy="true"><div/><div/></div>}
