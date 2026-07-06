import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { formatToday, greeting, formatTime } from '../constants.js'
import Avatar from '../components/Avatar.jsx'

export default function Dashboard({ ownerName, onOpenReorder, onAddItem }) {
  const [items, setItems] = useState(null)
  const [today, setToday] = useState(null)
  const [discrepancies, setDiscrepancies] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try {
      const [itemsData, todayData, discData] = await Promise.all([
        api.listItems(),
        api.countsToday(),
        api.discrepancies(),
      ])
      setItems(itemsData)
      setToday(todayData)
      setDiscrepancies(discData)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    const interval = setInterval(load, 60000)
    return () => {
      window.removeEventListener('focus', onFocus)
      clearInterval(interval)
    }
  }, [])

  const loading = items === null || today === null
  const reorderCount = items
    ? items.filter((i) => i.current_quantity <= i.reorder_threshold).length
    : 0
  const countedToday = today ? today.submissions.length > 0 : false

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">{greeting()}</h1>
          <div className="screen-subtitle">
            {ownerName ? `${ownerName} · ` : ''}{formatToday()}
          </div>
        </div>
      </header>

      {error && <div className="banner-error">{error}</div>}

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : (
        <>
          <div className="summary-row">
            <button className="summary-card">
              <span className="summary-icon" style={{ color: 'var(--forest)' }}>📦</span>
              <div className="summary-value">{items.length}</div>
              <div className="summary-label">Total Items</div>
            </button>
            <button className="summary-card" onClick={onOpenReorder}>
              <span className="summary-icon" style={{ color: 'var(--ember)' }}>🔔</span>
              <div className="summary-value" style={reorderCount ? { color: 'var(--ember)' } : undefined}>
                {reorderCount}
              </div>
              <div className="summary-label">Need Reorder</div>
            </button>
            <button className="summary-card">
              <span className="summary-icon" style={{ color: 'var(--saffron)' }}>✓</span>
              <div className="summary-value">{countedToday ? 'Yes' : 'No'}</div>
              <div className="summary-label">Counted Today</div>
            </button>
          </div>

          <h2 className="section-title">Today's Activity</h2>
          <div className="card-list">
            {today.submissions.length === 0 ? (
              <div className="empty-inline">
                <span>🕐</span>
                <span>No counts submitted today</span>
              </div>
            ) : (
              today.submissions.map((sub) => (
                <div className="activity-row" key={sub.employee_id || sub.employee_name}>
                  <Avatar name={sub.employee_name} />
                  <div className="activity-info">
                    <div className="activity-name">{sub.employee_name}</div>
                    <div className="activity-time">{formatTime(sub.submitted_at)}</div>
                    {sub.notes && <div className="activity-notes">“{sub.notes}”</div>}
                  </div>
                  <span className="count-badge">{sub.items_counted} items counted</span>
                </div>
              ))
            )}
          </div>

          {discrepancies.length > 0 && (
            <>
              <h2 className="section-title danger">⚠️ Discrepancies</h2>
              <div className="card-list">
                {discrepancies.map((d) => (
                  <div className="discrepancy-row" key={d.item_id}>
                    <div className="discrepancy-name">{d.item_name}</div>
                    <div className="discrepancy-detail">
                      Expected {d.expected_qty} · Reported {d.reported_qty} {d.unit} ·{' '}
                      <span className="discrepancy-variance">
                        {d.variance_percent > 0 ? '+' : ''}{d.variance_percent}%
                      </span>
                    </div>
                    <div className="discrepancy-detail">Reported by {d.reported_by}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <button className="fab" onClick={onAddItem} aria-label="Add Item">+</button>
    </div>
  )
}
