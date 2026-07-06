import { initials } from '../constants.js'

export default function Avatar({ name }) {
  return <span className="avatar">{initials(name)}</span>
}
