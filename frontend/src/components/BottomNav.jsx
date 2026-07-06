import { HomeIcon, BoxIcon, ClipboardIcon, UsersIcon } from './Icons.jsx'
import { buzz } from '../haptics.js'

const OWNER_TABS = [
  { key: 'home', label: 'Home', Icon: HomeIcon },
  { key: 'inventory', label: 'Inventory', Icon: BoxIcon },
  { key: 'count', label: 'Count', Icon: ClipboardIcon },
  { key: 'staff', label: 'Staff', Icon: UsersIcon },
]

export default function BottomNav({ role, active, onChange }) {
  const tabs =
    role === 'employee'
      ? [{ key: 'count', label: 'Count', Icon: ClipboardIcon }]
      : OWNER_TABS

  const activeIdx = Math.max(0, tabs.findIndex((t) => t.key === active))

  return (
    <nav className="tab-bar">
      <div className="tab-bar-inner" style={{ '--tabs': tabs.length }}>
        <span
          className="tab-indicator"
          style={{ transform: `translateX(${activeIdx * 100}%)` }}
        />
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`tab-btn ${active === key ? 'active' : ''}`}
            onClick={() => {
              if (key !== active) buzz(6)
              onChange(key)
            }}
            aria-label={label}
          >
            <Icon size={23} strokeWidth={active === key ? 2 : 1.8} />
            <span className="tab-label">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
