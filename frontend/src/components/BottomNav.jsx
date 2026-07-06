const OWNER_TABS = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'inventory', label: 'Inventory', icon: '📦' },
  { key: 'count', label: 'Count', icon: '✓' },
  { key: 'staff', label: 'Staff', icon: '👥' },
]

export default function BottomNav({ role, active, onChange }) {
  const tabs =
    role === 'employee' ? [{ key: 'count', label: 'Count', icon: '✓' }] : OWNER_TABS

  return (
    <nav className="tab-bar">
      <div className="tab-bar-inner">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${active === tab.key ? 'active' : ''}`}
            onClick={() => onChange(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
