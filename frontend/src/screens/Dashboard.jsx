import { useEffect, useState } from 'react'
import { api, clearSession } from '../api.js'
import { formatToday, greeting, formatTime } from '../constants.js'
import Avatar from '../components/Avatar.jsx'
import BottomSheet from '../components/BottomSheet.jsx'
import { SkeletonList } from '../components/Skeleton.jsx'
import { ClipboardIcon, BellIcon, ClockIcon, PlusIcon, LogoutIcon } from '../components/Icons.jsx'

export default function Dashboard({ ownerName, onOpenReorder, onOpenCount, onAddItem }) {
  const [items, setItems] = useState(null)
  const [today, setToday] = useState(null)
  const [discrepancies, setDiscrepancies] = useState([])
  const [error, setError] = useState('')
  const [showAccount, setShowAccount] = useState(false)

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

  const handleLogout = () => {
    clearSession()
    window.location.reload()
  }

  const loading = items === null || today === null
  const belowPar = items
    ? items.filter((i) => i.current_quantity <= i.reorder_threshold).length
    : 0
  const countedToday = today ? today.submissions.length > 0 : false
  const firstName = (ownerName || '').split(' ')[0]

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">
            {greeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
          <div className="screen-subtitle">{formatToday()}</div>
        </div>
        <button className="header-avatar-btn" onClick={() => setShowAccount(true)} aria-label="Account">
          <Avatar name={ownerName || 'Owner'} />
        </button>
      </header>

      {error && <div className="banner-error">{error}</div>}

      {loading ? (
        <>
          <div style={{ padding: '6px 20px 0' }}>
            <div className="skeleton" style={{ height: 84 }} />
          </div>
          <h2 className="section-title">Today</h2>
          <SkeletonList rows={2} height={64} />
        </>
      ) : (
        <>
          <div className="stats-strip">
            <div className="stat-cell">
              <div className="stat-value">{items.length}</div>
              <div className="stat-label">Items</div>
            </div>
            <button className="stat-cell" onClick={onOpenReorder}>
              <div className={`stat-value ${belowPar > 0 ? 'alert' : ''}`}>{belowPar}</div>
              <div className="stat-label">Below par</div>
            </button>
            <div className="stat-cell">
              <div className="stat-value">{countedToday ? 'Yes' : 'No'}</div>
              <div className="stat-label">Counted today</div>
            </div>
          </div>

          <div className="quick-actions">
            <button className="btn-secondary" onClick={onOpenCount}>
              <ClipboardIcon size={18} /> Start count
            </button>
            <button className="btn-secondary" onClick={onOpenReorder}>
              <BellIcon size={18} /> Reorder
            </button>
          </div>

          <h2 className="section-title">Today</h2>
          {today.submissions.length === 0 ? (
            <div className="empty-line">
              <ClockIcon size={20} />
              <span>
                {new Date().getHours() < 11
                  ? 'No counts yet — still early'
                  : new Date().getHours() < 17
                    ? 'No counts yet today'
                    : 'No count came in today'}
              </span>
            </div>
          ) : (
            <div className="list-group">
              {today.submissions.map((sub) => (
                <div className="list-row" key={sub.employee_id || sub.employee_name}>
                  <Avatar name={sub.employee_name} />
                  <div className="row-main">
                    <div className="row-title">{sub.employee_name}</div>
                    <div className="row-sub">{formatTime(sub.submitted_at)}</div>
                    {sub.notes && <div className="activity-note">{sub.notes}</div>}
                  </div>
                  <span className="row-badge">{sub.items_counted} items</span>
                </div>
              ))}
            </div>
          )}

          {discrepancies.length > 0 && (
            <>
              <h2 className="section-title danger">Needs review</h2>
              <div className="list-group">
                {discrepancies.map((d) => (
                  <div className="list-row" key={d.item_id}>
                    <div className="row-main">
                      <div className="row-title">{d.item_name}</div>
                      <div className="row-sub">
                        Expected {d.expected_qty}, counted {d.reported_qty} {d.unit} · {d.reported_by}
                      </div>
                    </div>
                    <span className="review-delta">
                      {d.variance_percent > 0 ? '+' : ''}{d.variance_percent}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <button className="fab" onClick={onAddItem} aria-label="Add item">
        <PlusIcon size={24} strokeWidth={2} />
      </button>

      {showAccount && (
        <BottomSheet onClose={() => setShowAccount(false)}>
          <div className="account-sheet-head">
            <Avatar name={ownerName || 'Owner'} />
            <div>
              <div className="account-name">{ownerName || 'Owner'}</div>
              <div className="account-role">Owner</div>
            </div>
          </div>
          <div className="sheet-actions">
            <button className="btn-text-danger" onClick={handleLogout}>
              <LogoutIcon size={18} /> Log out
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
