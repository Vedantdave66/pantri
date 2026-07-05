const TABS = [
  { key: 'inventory', label: 'Inventory', icon: '📦' },
  { key: 'count', label: 'Count', icon: '🔢' },
  { key: 'reorder', label: 'Reorder', icon: '📋' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="tab-bar">
      <div className="tab-bar-inner">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${active === tab.key ? 'active' : ''}`}
            onClick={() => onChange(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
