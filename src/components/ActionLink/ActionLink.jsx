import './ActionLink.css'
import { ctaAttributes } from '../../services/analyticsSensors.js'
import { trackEvent } from '../../services/analyticsService.js'
import { currentSourcePath } from '../../services/sourceContext.js'

export default function ActionLink({ href, variant = 'primary', className = '', children, analytics, onClick, ...linkProps }) {
  return (
    <a className={`action-link action-link--${variant} ${className}`.trim()} href={href} {...linkProps} {...ctaAttributes(analytics)} onClick={(event) => {
      onClick?.(event)
      if (analytics && !event.defaultPrevented && (href?.startsWith('/') || href?.startsWith('#'))) {
        trackEvent('cta_click', { ...analytics, destination_path: href.split(/[?#]/)[0] || currentSourcePath() })
      }
    }}>
      {children}
    </a>
  )
}
