import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { groupByCategory, formatToday } from '../constants.js'
import Toast from '../components/Toast.jsx'

export default function Count() {
  const [items, setItems] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await api.listItems()
        setItems(data)
        const initialCounts = {}
        data.forEach((item) => {
          initialCounts[item.id] = item.current_quantity
        })
        setCounts(initialCounts)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const grouped = useMemo(() => groupByCategory(items), [items])

  const setCount = (id, value) => {
    const num = Math.max(0, Number(value))
    setCounts((prev) => ({ ...prev, [id]: Number.isFinite(num) ? num : 0 }))
  }

  const adjust = (id, delta) => {
    setCounts((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta)
      return { ...prev, [id]: next }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const changed = items.filter((item) => counts[item.id] !== item.current_quantity)
      await Promise.all(changed.map((item) => api.countItem(item.id, counts[item.id])))
      setItems((prev) =>
        prev.map((item) => ({ ...item, current_quantity: counts[item.id] }))
      )
      setToast('Count saved ✓')
      setTimeout(() => setToast(''), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">Daily Count</h1>
          <div className="screen-date">{formatToday()}</div>
        </div>
      </header>

      {error && <div className="banner-error">{error}</div>}

      {loading ? (
        <div className="loading-wrap">Loading…</div>
      ) : (
        grouped.map((group) => (
          <div className="category-group" key={group.category}>
            <div className="category-title">{group.category}</div>
            <div className="item-list">
              {group.items.map((item) => (
                <div className="count-row" key={item.id}>
                  <div className="count-row-top">
                    <div className="item-name">{item.name}</div>
                    <div className="item-qty">{item.unit}</div>
                  </div>
                  <div className="count-controls">
                    <button
                      className="count-btn"
                      onClick={() => adjust(item.id, -1)}
                      aria-label={`Decrease ${item.name}`}
                    >
                      −
                    </button>
                    <input
                      className="count-input"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={counts[item.id] ?? 0}
                      onChange={(e) => setCount(item.id, e.target.value)}
                    />
                    <button
                      className="count-btn"
                      onClick={() => adjust(item.id, 1)}
                      aria-label={`Increase ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {!loading && items.length > 0 && (
        <div className="count-footer">
          <div className="count-footer-inner">
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Count'}
            </button>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
