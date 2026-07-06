import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { groupByCategory, formatToday, timeAgo } from '../constants.js'
import Avatar from '../components/Avatar.jsx'
import Toast from '../components/Toast.jsx'

function CountRow({ item, value, onAdjust, onSet, lastCount }) {
  return (
    <div className="count-card">
      <div>
        <div className="count-item-name">{item.name}</div>
        <div className="count-item-unit">{item.unit}</div>
      </div>
      <div className="count-controls">
        <button
          className="count-btn minus"
          onClick={() => onAdjust(item.id, -1)}
          aria-label={`Decrease ${item.name}`}
        >
          −
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
          +
        </button>
      </div>
      {lastCount && (
        <div className="count-last-by">
          <Avatar name={lastCount.employee_name} />
          <span>
            Last counted by {lastCount.employee_name || 'owner'}, {timeAgo(lastCount.counted_at)}
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
        setToast('Count saved ✓')
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
      <div className="success-screen">
        <div className="success-check">✓</div>
        <h1 className="success-title">Count submitted ✓</h1>
        <div className="success-subtitle">Your manager has been notified</div>
      </div>
    )
  }

  if (alreadyDone) {
    return (
      <div className="success-screen">
        <div className="success-check">✓</div>
        <h1 className="success-title">Already submitted today</h1>
        <div className="success-subtitle">Come back tomorrow for the next count</div>
      </div>
    )
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">{isEmployee ? 'Count' : 'Daily Count'}</h1>
          <div className="screen-subtitle">
            {userName ? `${userName} · ` : ''}{formatToday()}
          </div>
        </div>
      </header>

      {error && <div className="banner-error">{error}</div>}

      {items === null ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : isEmployee ? (
        <>
          <div className="card-list">
            {items.map((item) => (
              <CountRow
                key={item.id}
                item={item}
                value={counts[item.id] ?? 0}
                onAdjust={adjust}
                onSet={setCount}
              />
            ))}
          </div>
          <div className="notes-wrap">
            <textarea
              className="notes-input"
              placeholder="Any notes for the owner?"
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
              {saving
                ? 'Submitting…'
                : isEmployee
                  ? `Submit ${changedEntries.length} count${changedEntries.length === 1 ? '' : 's'}`
                  : 'Save Count'}
            </button>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
