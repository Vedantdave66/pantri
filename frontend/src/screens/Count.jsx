import { useEffect, useMemo, useState } from 'react'
import { api, clearSession } from '../api.js'
import { groupByCategory, formatToday, timeAgo } from '../constants.js'
import Avatar from '../components/Avatar.jsx'
import Toast from '../components/Toast.jsx'
import { SkeletonList } from '../components/Skeleton.jsx'
import { buzz } from '../haptics.js'
import {
  PlusIcon,
  MinusIcon,
  CheckIcon,
  NoteIcon,
  LogoutIcon,
} from '../components/Icons.jsx'

const CONFETTI = [
  { left: '8%', color: '#F4A535', size: 10, dx: 30, rot: 620, delay: 0, dur: 2.4, round: false },
  { left: '18%', color: '#2D6A4F', size: 8, dx: -26, rot: 480, delay: 0.15, dur: 2.7, round: true },
  { left: '28%', color: '#E76F51', size: 11, dx: 20, rot: 700, delay: 0.05, dur: 2.5, round: false },
  { left: '38%', color: '#C1121F', size: 7, dx: -34, rot: 520, delay: 0.25, dur: 2.9, round: true },
  { left: '48%', color: '#F7B750', size: 12, dx: 24, rot: 640, delay: 0.1, dur: 2.3, round: false },
  { left: '58%', color: '#3B8765', size: 8, dx: -18, rot: 560, delay: 0.3, dur: 2.6, round: false },
  { left: '68%', color: '#F4A535', size: 9, dx: 36, rot: 480, delay: 0.2, dur: 2.8, round: true },
  { left: '78%', color: '#E76F51', size: 10, dx: -28, rot: 600, delay: 0.08, dur: 2.4, round: false },
  { left: '88%', color: '#2D6A4F', size: 8, dx: 18, rot: 540, delay: 0.35, dur: 2.7, round: true },
  { left: '33%', color: '#F7B750', size: 7, dx: -40, rot: 660, delay: 0.45, dur: 3.0, round: false },
  { left: '63%', color: '#C1121F', size: 9, dx: 30, rot: 500, delay: 0.4, dur: 2.9, round: false },
  { left: '93%', color: '#F4A535', size: 8, dx: -22, rot: 580, delay: 0.5, dur: 3.1, round: true },
]

function Confetti() {
  return (
    <>
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: c.left,
            background: c.color,
            '--size': `${c.size}px`,
            '--dx': `${c.dx}px`,
            '--rot': `${c.rot}deg`,
            '--delay': `${c.delay}s`,
            '--dur': `${c.dur}s`,
            '--shape': c.round ? '50%' : '2px',
          }}
        />
      ))}
    </>
  )
}

function SuccessScreen({ title, subtitle, onLogout }) {
  return (
    <div className="success-screen">
      <Confetti />
      <div className="success-svg-wrap">
        <svg className="success-svg" viewBox="0 0 104 104">
          <circle className="success-ring" cx="52" cy="52" r="46" />
          <path className="success-tick" d="M33 54.5 47.5 69 72 39" />
        </svg>
      </div>
      <h1 className="success-title">{title}</h1>
      <div className="success-subtitle">{subtitle}</div>
      {onLogout && (
        <button className="success-logout" onClick={onLogout}>
          <LogoutIcon size={17} /> Log out
        </button>
      )}
    </div>
  )
}

function CountRow({ item, value, touched, onAdjust, onSet, lastCount, index }) {
  const [bump, setBump] = useState(false)

  const handleAdjust = (delta) => {
    buzz(7)
    setBump(false)
    requestAnimationFrame(() => setBump(true))
    onAdjust(item.id, delta)
  }

  return (
    <div className={`count-card rise ${touched ? 'touched' : ''}`} style={{ '--i': index }}>
      <div className="count-card-top">
        <div>
          <div className="count-item-name">{item.name}</div>
          <div className="count-item-unit">{item.unit}</div>
        </div>
        {touched && (
          <span className="counted-tick"><CheckIcon size={15} strokeWidth={2.6} /></span>
        )}
      </div>
      <div className="count-controls">
        <button
          className="count-btn minus"
          onClick={() => handleAdjust(-1)}
          aria-label={`Decrease ${item.name}`}
        >
          <MinusIcon size={26} strokeWidth={2.2} />
        </button>
        <input
          className={`count-value ${bump ? 'bump' : ''}`}
          type="number"
          inputMode="decimal"
          min="0"
          value={value}
          onChange={(e) => onSet(item.id, e.target.value)}
          onAnimationEnd={() => setBump(false)}
        />
        <button
          className="count-btn plus"
          onClick={() => handleAdjust(1)}
          aria-label={`Increase ${item.name}`}
        >
          <PlusIcon size={26} strokeWidth={2.2} />
        </button>
      </div>
      {lastCount && (
        <div className="count-last-by">
          <Avatar name={lastCount.employee_name} />
          <span>
            Last counted by {lastCount.employee_name || 'owner'} · {timeAgo(lastCount.counted_at)}
          </span>
        </div>
      )}
    </div>
  )
}

export default function Count({ role, userName }) {
  const isEmployee = role === 'employee'
  const [items, setItems] = useState(null)
  const [counts, setCounts] = useState({})
  const [touched, setTouched] = useState({})
  const [latest, setLatest] = useState({})
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)

  useEffect(() => {
    const load = async () => {
      setError('')
      try {
        if (isEmployee) {
          const status = await api.myCountToday()
          if (status.submitted) {
            setAlreadyDone(true)
            setItems([])
            return
          }
        }
        const data = await api.listItems()
        setItems(data)
        const initial = {}
        data.forEach((item) => {
          initial[item.id] = isEmployee ? 0 : item.current_quantity
        })
        setCounts(initial)
        if (!isEmployee) {
          try {
            setLatest(await api.countsLatest())
          } catch {
            // last-counted info is decorative; ignore failures
          }
        }
      } catch (err) {
        setError(err.message)
        setItems([])
      }
    }
    load()
  }, [isEmployee])

  const grouped = useMemo(
    () => (items && !isEmployee ? groupByCategory(items) : []),
    [items, isEmployee]
  )

  const setCount = (id, value) => {
    const num = Math.max(0, Number(value))
    setCounts((prev) => ({ ...prev, [id]: Number.isFinite(num) ? num : 0 }))
    setTouched((prev) => ({ ...prev, [id]: true }))
  }

  const adjust = (id, delta) => {
    setCounts((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta)
      return { ...prev, [id]: next }
    })
    setTouched((prev) => ({ ...prev, [id]: true }))
  }

  const touchedCount = useMemo(
    () => (items ? items.filter((i) => touched[i.id]).length : 0),
    [items, touched]
  )

  const changedEntries = useMemo(() => {
    if (!items) return []
    if (isEmployee) {
      return items
        .filter((item) => touched[item.id])
        .map((item) => ({ item_id: item.id, new_quantity: counts[item.id] }))
    }
    return items
      .filter((item) => counts[item.id] !== item.current_quantity)
      .map((item) => ({ item_id: item.id, new_quantity: counts[item.id] }))
  }, [items, counts, touched, isEmployee])

  const handleLogout = () => {
    clearSession()
    window.location.reload()
  }

  const handleSubmit = async () => {
    if (changedEntries.length === 0) return
    setSaving(true)
    setError('')
    try {
      await api.submitCounts(changedEntries, isEmployee ? notes.trim() : null)
      buzz(20)
      if (isEmployee) {
        setSubmitted(true)
      } else {
        setItems((prev) =>
          prev.map((item) => ({ ...item, current_quantity: counts[item.id] }))
        )
        setTouched({})
        setToast('Count saved')
        setTimeout(() => setToast(''), 2000)
      }
    } catch (err) {
      if (err.status === 409) {
        setAlreadyDone(true)
      } else {
        setError(err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  if (submitted) {
    return (
      <SuccessScreen
        title="Count submitted"
        subtitle="Your manager has been notified"
        onLogout={isEmployee ? handleLogout : null}
      />
    )
  }

  if (alreadyDone) {
    return (
      <SuccessScreen
        title="Already submitted today"
        subtitle="Come back tomorrow for the next count"
        onLogout={isEmployee ? handleLogout : null}
      />
    )
  }

  let runningIndex = 0

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <div className="header-eyebrow">{formatToday()}</div>
          <h1 className="screen-title">{isEmployee ? 'Count' : 'Daily Count'}</h1>
          {userName && <div className="screen-subtitle">{userName}</div>}
        </div>
      </header>

      {isEmployee && items && items.length > 0 && (
        <div className="count-progress-wrap">
          <div className="count-progress-label">
            <span>Counting progress</span>
            <strong>{touchedCount} of {items.length}</strong>
          </div>
          <div className="count-progress-track">
            <div
              className="count-progress-fill"
              style={{ width: `${(touchedCount / items.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && <div className="banner-error">{error}</div>}

      {items === null ? (
        <SkeletonList rows={4} height={150} />
      ) : isEmployee ? (
        <>
          <div className="card-list">
            {items.map((item, i) => (
              <CountRow
                key={item.id}
                index={i}
                item={item}
                value={counts[item.id] ?? 0}
                touched={Boolean(touched[item.id])}
                onAdjust={adjust}
                onSet={setCount}
              />
            ))}
          </div>
          <div className="notes-wrap rise" style={{ '--i': Math.min(items.length, 10) }}>
            <div className="notes-label">
              <NoteIcon size={17} /> Note for the owner
            </div>
            <textarea
              className="notes-input"
              placeholder="Anything worth flagging? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </>
      ) : (
        grouped.map((group) => {
          const groupStart = runningIndex
          runningIndex += group.items.length
          return (
            <div key={group.category}>
              <div className="category-title">{group.category}</div>
              <div className="card-list">
                {group.items.map((item, i) => (
                  <CountRow
                    key={item.id}
                    index={groupStart + i}
                    item={item}
                    value={counts[item.id] ?? 0}
                    touched={Boolean(touched[item.id])}
                    onAdjust={adjust}
                    onSet={setCount}
                    lastCount={latest[item.id]}
                  />
                ))}
              </div>
            </div>
          )
        })
      )}

      {items !== null && items.length > 0 && (
        <div className="count-footer">
          <div className="count-footer-inner">
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={saving || changedEntries.length === 0}
            >
              {saving && <span className="btn-spinner" />}
              {saving
                ? 'Submitting…'
                : isEmployee
                  ? `Submit ${changedEntries.length} count${changedEntries.length === 1 ? '' : 's'}`
                  : changedEntries.length > 0
                    ? `Save Count · ${changedEntries.length} change${changedEntries.length === 1 ? '' : 's'}`
                    : 'Save Count'}
            </button>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
