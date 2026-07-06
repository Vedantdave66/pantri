import { useEffect, useMemo, useRef, useState } from 'react'
import { api, clearSession } from '../api.js'
import { groupByCategory, formatToday, timeAgo, dailyPick, formatDuration } from '../constants.js'
import Toast from '../components/Toast.jsx'
import { SkeletonList } from '../components/Skeleton.jsx'
import { buzz } from '../haptics.js'
import { PlusIcon, MinusIcon, CheckIcon, LogoutIcon } from '../components/Icons.jsx'

const CONFETTI = [
  { left: '8%', color: '#E98A2B', size: 10, dx: 30, rot: 620, delay: 0, dur: 2.4, round: false },
  { left: '18%', color: '#2D6A4F', size: 8, dx: -26, rot: 480, delay: 0.15, dur: 2.7, round: true },
  { left: '28%', color: '#E76F51', size: 11, dx: 20, rot: 700, delay: 0.05, dur: 2.5, round: false },
  { left: '38%', color: '#C1121F', size: 7, dx: -34, rot: 520, delay: 0.25, dur: 2.9, round: true },
  { left: '48%', color: '#F4A535', size: 12, dx: 24, rot: 640, delay: 0.1, dur: 2.3, round: false },
  { left: '58%', color: '#3B8765', size: 8, dx: -18, rot: 560, delay: 0.3, dur: 2.6, round: false },
  { left: '68%', color: '#E98A2B', size: 9, dx: 36, rot: 480, delay: 0.2, dur: 2.8, round: true },
  { left: '78%', color: '#E76F51', size: 10, dx: -28, rot: 600, delay: 0.08, dur: 2.4, round: false },
  { left: '88%', color: '#2D6A4F', size: 8, dx: 18, rot: 540, delay: 0.35, dur: 2.7, round: true },
  { left: '33%', color: '#F4A535', size: 7, dx: -40, rot: 660, delay: 0.45, dur: 3.0, round: false },
  { left: '63%', color: '#C1121F', size: 9, dx: 30, rot: 500, delay: 0.4, dur: 2.9, round: false },
  { left: '93%', color: '#E98A2B', size: 8, dx: -22, rot: 580, delay: 0.5, dur: 3.1, round: true },
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

const SUCCESS_TITLES = [
  'Count submitted',
  'All counted',
  "Count's in",
  'Done and dusted',
  'Counted and closed',
]

const FRIDAY_TITLE = "That's the week"

const NOTE_PLACEHOLDERS = [
  'Optional note for the owner',
  'Anything off? Note it here',
  'Low, broken, or missing — note it',
]

function SuccessScreen({ title, subtitle, onLogout }) {
  return (
    <div className="success-screen">
      <Confetti />
      <div className="success-svg-wrap">
        <svg className="success-svg" viewBox="0 0 88 88">
          <path className="success-tick" d="M27 45.5 39.5 58 61 32" />
        </svg>
      </div>
      <h1 className="success-title">{title}</h1>
      <div className="success-subtitle">{subtitle}</div>
      {onLogout && (
        <button className="success-logout" onClick={onLogout}>
          <LogoutIcon size={16} /> Log out
        </button>
      )}
    </div>
  )
}

function CountRow({ item, value, touched, onAdjust, onSet, lastCount }) {
  const [bump, setBump] = useState(false)

  const handleAdjust = (delta) => {
    buzz(7)
    setBump(false)
    requestAnimationFrame(() => setBump(true))
    onAdjust(item.id, delta)
  }

  const sub = lastCount
    ? `${item.unit} · ${lastCount.employee_name || 'owner'}, ${timeAgo(lastCount.counted_at)}`
    : item.unit

  return (
    <div className="count-row">
      <div className="count-row-main">
        <div className="count-row-name">
          {item.name}
          {touched && <CheckIcon size={15} strokeWidth={2.4} />}
        </div>
        <div className="count-row-sub">{sub}</div>
      </div>
      <div className="count-stepper">
        <button
          className="count-btn"
          onClick={() => handleAdjust(-1)}
          aria-label={`Decrease ${item.name}`}
        >
          <MinusIcon size={20} strokeWidth={2} />
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
          className="count-btn"
          onClick={() => handleAdjust(1)}
          aria-label={`Increase ${item.name}`}
        >
          <PlusIcon size={20} strokeWidth={2} />
        </button>
      </div>
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
  const [submitStats, setSubmitStats] = useState(null)
  const startedAtRef = useRef(null)
  const celebratedRef = useRef(false)

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
        startedAtRef.current = Date.now()
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

  const allCounted = Boolean(items && items.length > 0 && touchedCount === items.length)

  useEffect(() => {
    if (isEmployee && allCounted && !celebratedRef.current) {
      celebratedRef.current = true
      buzz(15)
    }
  }, [isEmployee, allCounted])

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
      buzz(18)
      if (isEmployee) {
        const elapsed = startedAtRef.current ? Date.now() - startedAtRef.current : null
        setSubmitStats({ count: changedEntries.length, elapsed })
        setSubmitted(true)
      } else {
        setItems((prev) =>
          prev.map((item) => ({ ...item, current_quantity: counts[item.id] }))
        )
        setTouched({})
        setToast(`Saved ${changedEntries.length} item${changedEntries.length === 1 ? '' : 's'}`)
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
    const isFriday = new Date().getDay() === 5
    const quickHands =
      submitStats?.elapsed && submitStats.count > 3 && submitStats.elapsed / submitStats.count < 8000
    const title = quickHands
      ? 'Quick hands'
      : isFriday
        ? FRIDAY_TITLE
        : dailyPick(SUCCESS_TITLES)
    const subtitle = submitStats?.elapsed
      ? `${submitStats.count} item${submitStats.count === 1 ? '' : 's'} in ${formatDuration(submitStats.elapsed)}`
      : "You're done for today"
    return (
      <SuccessScreen
        title={title}
        subtitle={subtitle}
        onLogout={isEmployee ? handleLogout : null}
      />
    )
  }

  if (alreadyDone) {
    return (
      <SuccessScreen
        title="Already submitted today"
        subtitle="Come back tomorrow"
        onLogout={isEmployee ? handleLogout : null}
      />
    )
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">{isEmployee ? 'Count' : 'Daily count'}</h1>
          <div className="screen-subtitle">
            {userName ? `${userName} · ` : ''}{formatToday()}
          </div>
        </div>
      </header>

      {isEmployee && items && items.length > 0 && (
        <div className="count-progress-wrap">
          <div className="count-progress-label">
            <span>Progress</span>
            {allCounted ? (
              <span className="done">All counted</span>
            ) : (
              <span>{touchedCount} of {items.length}</span>
            )}
          </div>
          <div className="count-progress-track">
            <div
              className={`count-progress-fill ${allCounted ? 'complete' : ''}`}
              style={{ width: `${(touchedCount / items.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && <div className="banner-error">{error}</div>}

      {items === null ? (
        <SkeletonList rows={6} height={64} />
      ) : isEmployee ? (
        <>
          <div className="list-group">
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
            <label className="field-label" htmlFor="count-notes">Notes</label>
            <textarea
              id="count-notes"
              className="notes-input"
              placeholder={dailyPick(NOTE_PLACEHOLDERS)}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </>
      ) : (
        grouped.map((group) => (
          <div key={group.category}>
            <div className="group-label">{group.category}</div>
            <div className="list-group">
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
                ? 'Saving'
                : isEmployee
                  ? 'Submit count'
                  : 'Save count'}
            </button>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
