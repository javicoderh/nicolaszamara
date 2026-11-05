import './ArticleImageEditorSkeleton.css'
export default function ArticleImageEditorSkeleton({ label = 'Preparando imagen' }) {
  return <div className="article-image-editor-skeleton" role="status" aria-label={label} aria-busy="true"><div /><span /><span /></div>
}
