import { CheckIcon } from './Icons.jsx'

export default function Toast({ message }) {
  if (!message) return null
  return (
    <div className="toast">
      <CheckIcon size={18} strokeWidth={2.4} />
      {message}
    </div>
  )
}
