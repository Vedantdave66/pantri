import { useEffect, useState } from 'react'
import { api, clearSession } from '../api.js'
import { formatToday, greeting, formatTime } from '../constants.js'
import Avatar from '../components/Avatar.jsx'
import BottomSheet from '../components/BottomSheet.jsx'
import { SkeletonList } from '../components/Skeleton.jsx'
import AnimatedNumber from '../components/AnimatedNumber.jsx'
import {
  BoxIcon,
  BellIcon,
  ClipboardIcon,
  ClockIcon,
  AlertIcon,
  PlusIcon,
  LogoutIcon,
} from '../components/Icons.jsx'

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
  const reorderCount = items
    ? items.filter((i) => i.current_quantity <= i.reorder_threshold).length
    : 0
  const countedToday = today ? today.submissions.length > 0 : false
  const firstName = (ownerName || '').split(' ')[0]

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <div className="header-eyebrow">{formatToday()}</div>
          <h1 className="screen-title">
            {greeting().replace(' 👋', '')}{firstName ? `, ${firstName}` : ''}{' '}
            <span className="wave">👋</span>
          </h1>
        </div>
        <button className="header-avatar-btn" onClick={() => setShowAccount(true)} aria-label="Account">
          <Avatar name={ownerName || 'Owner'} />
        </button>
      </header>

      {error && <div className="banner-error"><AlertIcon size={18} />{error}</div>}

      {loading ? (
        <>
          <div className="summary-row">
            <div className="skeleton" style={{ height: 118, flex: 1 }} />
            <div className="skeleton" style={{ height: 118, flex: 1 }} />
            <div className="skeleton" style={{ height: 118, flex: 1 }} />
          </div>
          <h2 className="section-title">Today's Activity</h2>
          <SkeletonList rows={2} height={70} />
        </>
      ) : (
        <>
          <div className="summary-row">
            <button
              className="summary-card rise"
              style={{ '--i': 0, '--accent': 'var(--forest)', '--accent-soft': 'var(--forest-soft)' }}
            >
              <span className="summary-icon"><BoxIcon size={20} /></span>
              <div className="summary-value"><AnimatedNumber value={items.length} /></div>
              <div className="summary-label">Total Items</div>
            </button>
            <button
              className="summary-card rise"
              onClick={onOpenReorder}
              style={{ '--i': 1, '--accent': 'var(--ember)', '--accent-soft': 'var(--ember-soft)' }}
            >
              <span className="summary-icon"><BellIcon size={20} /></span>
              <div className="summary-value" style={reorderCount ? { color: 'var(--ember)' } : undefined}>
                <AnimatedNumber value={reorderCount} />
              </div>
              <div className="summary-label">Need Reorder</div>
            </button>
            <button
              className="summary-card rise"
              onClick={onOpenCount}
              style={{ '--i': 2, '--accent': 'var(--saffron)', '--accent-soft': 'var(--saffron-soft)' }}
            >
              <span className="summary-icon"><ClipboardIcon size={20} /></span>
              <div className="summary-value">{countedToday ? 'Yes' : 'No'}</div>
              <div className="summary-label">Counted Today</div>
            </button>
          </div>

          <div className="quick-actions rise" style={{ '--i': 3 }}>
            <button className="quick-action" onClick={onOpenCount}>
              <ClipboardIcon size={19} /> Start Count
            </button>
            <button className="quick-action" onClick={onOpenReorder}>
              <BellIcon size={19} /> Reorder List
            </button>
          </div>

          <h2 className="section-title rise" style={{ '--i': 4 }}>Today's Activity</h2>
          <div className="card-list">
            {today.submissions.length === 0 ? (
              <div className="empty-inline rise" style={{ '--i': 5 }}>
                <span className="swing"><ClockIcon size={22} /></span>
                <span>No counts submitted today</span>
              </div>
            ) : (
              today.submissions.map((sub, i) => (
                <div
                  className="activity-row rise"
                  style={{ '--i': 5 + i }}
                  key={sub.employee_id || sub.employee_name}
                >
                  <Avatar name={sub.employee_name} />
                  <div className="activity-info">
                    <div className="activity-name">{sub.employee_name}</div>
                    <div className="activity-time">Submitted at {formatTime(sub.submitted_at)}</div>
                    {sub.notes && <div className="activity-notes">“{sub.notes}”</div>}
                  </div>
                  <span className="count-badge">{sub.items_counted} items</span>
                </div>
              ))
            )}
          </div>

          {discrepancies.length > 0 && (
            <>
              <h2 className="section-title danger rise" style={{ '--i': 6 }}>
                <AlertIcon size={19} /> Discrepancies
              </h2>
              <div className="card-list">
                {discrepancies.map((d, i) => (
                  <div className="discrepancy-row rise" style={{ '--i': 7 + i }} key={d.item_id}>
                    <span className="discrepancy-icon"><AlertIcon size={19} /></span>
                    <div className="discrepancy-body">
                      <div className="discrepancy-name">
                        {d.item_name}
                        <span className="variance-pill">
                          {d.variance_percent > 0 ? '+' : ''}{d.variance_percent}%
                        </span>
                      </div>
                      <div className="discrepancy-detail">
                        Expected {d.expected_qty} · reported {d.reported_qty} {d.unit}
                      </div>
                      <div className="discrepancy-detail">Reported by {d.reported_by}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <button className="fab" onClick={onAddItem} aria-label="Add Item">
        <PlusIcon size={26} strokeWidth={2.2} />
      </button>

      {showAccount && (
        <BottomSheet onClose={() => setShowAccount(false)}>
          <div className="account-sheet-head">
            <Avatar name={ownerName || 'Owner'} />
            <div>
              <div className="activity-name">{ownerName || 'Owner'}</div>
              <span className="account-role-badge">Owner</span>
            </div>
          </div>
          <div className="sheet-actions">
            <button className="btn-text-danger" onClick={handleLogout}>
              <LogoutIcon size={19} /> Log Out
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
