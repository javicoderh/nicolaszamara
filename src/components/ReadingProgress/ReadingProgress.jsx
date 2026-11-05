import { useEffect, useState } from 'react'
import { trackEvent } from '../../services/analyticsService.js'
import './ReadingProgress.css'
export default function ReadingProgress({ articleId, rootRef, ready = true }) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    setProgress(0)
    if (!ready) return
    const root = rootRef?.current
    const body = (root || document).querySelector('.article-content__body')
    if (!body) return
    let sent = false
    const update = () => {
      const bounds = body.getBoundingClientRect(), viewportBottom = root ? root.getBoundingClientRect().bottom : window.innerHeight
      const value = Math.max(0, Math.min(100, (viewportBottom - bounds.top) / Math.max(bounds.height, 1) * 100))
      setProgress(value)
      if (value >= 90 && document.visibilityState === 'visible' && !sent && articleId) sent = trackEvent('blog_read_complete', { article_id: articleId })
    }
    const target = root || window
    target.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); document.addEventListener('visibilitychange', update)
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null; observer?.observe(body)
    update()
    return () => { target.removeEventListener('scroll', update); window.removeEventListener('resize', update); document.removeEventListener('visibilitychange', update); observer?.disconnect() }
  }, [articleId, ready, rootRef])
  return <div className="reading-progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress / 100})` }}/></div>
}
