import './InterestFormSkeleton.css'
import ContactPreferenceSkeleton from '../ContactPreference/ContactPreferenceSkeleton.jsx'

export default function InterestFormSkeleton() {
  return <div className="interest-form-skeleton" aria-hidden="true"><span /><span /><span /><span /><span /><ContactPreferenceSkeleton /><span /></div>
}
