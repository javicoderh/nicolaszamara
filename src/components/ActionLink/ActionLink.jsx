import './ActionLink.css'

export default function ActionLink({ href, variant = 'primary', className = '', children, ...linkProps }) {
  return (
    <a className={`action-link action-link--${variant} ${className}`.trim()} href={href} {...linkProps}>
      {children}
    </a>
  )
}
