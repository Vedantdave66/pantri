import { useEffect, useMemo, useState } from 'react'
import { api, clearSession } from '../api.js'
import { groupByCategory, formatToday, timeAgo } from '../constants.js'
import Avatar from '../components/Avatar.jsx'
import Toast from '../components/Toast.jsx'
import { SkeletonList } from '../components/Skeleton.jsx'
import {
  PlusIcon,
  MinusIcon,
  CheckIcon,
  NoteIcon,
  LogoutIcon,
} from '../components/Icons.jsx'

const CONFETTI_COLORS = ['#F4A535', '#E76F51', '#2D6A4F', '#C1121F', '#F7B750', '#3B8765']

function Confetti() {
  return (
    <>
      {CONFETTI_COLORS.map((color, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${12 + i * 14}%`,
            background: color,
            animationDelay: `${i * 0.12}s`,
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
      <div className="success-check"><CheckIcon size={52} strokeWidth={2.4} /></div>
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

function CountRow({ item, value, touched, onAdjust, onSet, lastCount }) {
  return (
    <div className={`count-card ${touched ? 'touched' : ''}`}>
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
          onClick={() => onAdjust(item.id, -1)}
          aria-label={`Decrease ${item.name}`}
        >
          <MinusIcon size={26} strokeWidth={2.2} />
        </button>
        <input
          className="count-value"
          type="number"
          inputMode="decimal"
          min="0"
          value={value}
          onChange={(e) => onSet(item.id, e.target.value)}
        />
        <button
          className="count-btn plus"
          onClick={() => onAdjust(item.id, 1)}
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
            {items.map((item) => (
              <CountRow
                key={item.id}
                item={item}
                value={counts[item.id] ?? 0}
                touched={Boolean(touched[item.id])}
                onAdjust={adjust}
                onSet={setCount}
              />
            ))}
          </div>
          <div className="notes-wrap">
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
        grouped.map((group) => (
          <div key={group.category}>
            <div className="category-title">{group.category}</div>
            <div className="card-list">
              {group.items.map((item) => (
                <CountRow
                  key={item.id}
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
        ))
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
