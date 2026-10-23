import './ChatFeedbackSkeleton.css'

export default function ChatFeedbackSkeleton() {
  return <div className="chat-feedback-skeleton" role="status" aria-label="Guardando propuesta" aria-busy="true"><span aria-hidden="true" />Guardando propuesta…</div>
}
