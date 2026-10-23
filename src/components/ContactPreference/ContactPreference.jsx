import { useId, useState } from 'react'
import contactConfig from '../../../config/interests/contact.config.json'
import './ContactPreference.css'

const iconPaths = {
  video_call: ['M3 6h12v12H3z', 'm15 10 6-3v10l-6-3'],
  phone: ['M7 3 3 5c0 9 7 16 16 16l2-4-5-3-2 2a12 12 0 0 1-6-6l2-2z'],
  whatsapp: ['M21 11.5a9 9 0 0 1-13.4 7.9L3 21l1.6-4.6A9 9 0 1 1 21 11.5Z', 'm8 7-1 1c0 4 3 7 7 7l1-1-2-2-1 1a7 7 0 0 1-3-3l1-1-2-2Z'],
}

export default function ContactPreference({ name = 'contactPreference', value, onChange, disabled = false }) {
  const id = useId()
  const [hovered, setHovered] = useState(null)
  const [focused, setFocused] = useState(null)
  return <fieldset className="contact-preference" disabled={disabled}>
    <legend>Preferencia de contacto *</legend>
    <div className="contact-preference__choices">
      {contactConfig.preferences.map((option) => {
        const tooltipId = `${id}-${option.value}-tooltip`
        const showTooltip = hovered === option.value || focused === option.value
        return <label className="contact-preference__option" key={option.value}
          onMouseEnter={() => setHovered(option.value)} onMouseLeave={() => setHovered(null)}>
          <span className="contact-preference__control">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              {iconPaths[option.value].map((path) => <path d={path} key={path} />)}
            </svg>
            <input type="radio" name={name} value={option.value} required aria-label={option.label}
              checked={value === undefined ? undefined : value === option.value} onChange={onChange}
              aria-describedby={showTooltip ? tooltipId : undefined}
              onFocus={() => setFocused(option.value)} onBlur={() => setFocused(null)}
              onKeyDown={(event) => { if (event.key === 'Escape') { setHovered(null); setFocused(null) } }} />
          </span>
          <span className="contact-preference__label">{option.label}</span>
          {showTooltip && <span role="tooltip" id={tooltipId} className="contact-preference__tooltip">{option.label}</span>}
        </label>
      })}
    </div>
  </fieldset>
}
