import { useEffect, useState } from 'react'
import { api } from '../api.js'
import Toast from '../components/Toast.jsx'

function buildShareText(items) {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const lines = items.map((item) => {
    const need = Math.max(0, item.reorder_threshold - item.current_quantity)
    return `• ${item.name}: need ${need} ${item.unit}`
  })
  return `Pantri Reorder List — ${date}\n${lines.join('\n')}`
}

export default function Reorder() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await api.reorderList()
        setItems(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleShare = async () => {
    const text = buildShareText(items)
    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {
        // user cancelled or share failed, fall back to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setToast('Copied to clipboard ✓')
      setTimeout(() => setToast(''), 2000)
    } catch {
      setToast('Unable to copy')
      setTimeout(() => setToast(''), 2000)
    }
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">Reorder List</h1>
        </div>
        {items.length > 0 && (
          <button className="header-action" onClick={handleShare}>
            Share
          </button>
        )}
      </header>

      {error && <div className="banner-error">{error}</div>}

      {loading ? (
        <div className="loading-wrap">Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">All stocked up 🎉</div>
          <div>Nothing needs reordering right now.</div>
        </div>
      ) : (
        <div className="item-list" style={{ padding: '0 16px' }}>
          {items.map((item) => (
            <div className="reorder-row" key={item.id}>
              <div className="item-info">
                <div className="item-name">{item.name}</div>
                <div className="reorder-detail">
                  {item.current_quantity} {item.unit} on hand · reorder at {item.reorder_threshold}
                </div>
              </div>
              <span className="low-badge">LOW</span>
            </div>
          ))}
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
