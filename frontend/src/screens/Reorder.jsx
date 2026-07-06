import { useEffect, useState } from 'react'
import { api } from '../api.js'
import Toast from '../components/Toast.jsx'
import { SkeletonList } from '../components/Skeleton.jsx'
import { ShareIcon, AlertIcon, CheckIcon, ChevronIcon } from '../components/Icons.jsx'

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

export default function Reorder({ onBack }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const load = async () => {
      setError('')
      try {
        setItems(await api.reorderList())
      } catch (err) {
        setError(err.message)
        setItems([])
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
        // user cancelled or share failed; fall back to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      setToast('Copied to clipboard')
    } catch {
      setToast('Unable to copy')
    }
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              <ChevronIcon size={16} /> Back
            </button>
          )}
          <h1 className="screen-title">Reorder</h1>
        </div>
        {items && items.length > 0 && (
          <button className="header-action" onClick={handleShare}>
            <ShareIcon size={17} /> Share
          </button>
        )}
      </header>

      {error && <div className="banner-error">{error}</div>}

      {items === null ? (
        <SkeletonList rows={3} height={82} />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-check"><CheckIcon size={40} strokeWidth={2.2} /></div>
          <div className="empty-title">You're fully stocked</div>
          <div className="empty-subtitle">Check back after next count</div>
        </div>
      ) : (
        <>
          <div className="reorder-banner">
            <AlertIcon size={19} />
            {items.length} item{items.length === 1 ? '' : 's'} need restocking
          </div>
          <div className="card-list">
            {items.map((item) => {
              const short = Math.max(0, item.reorder_threshold - item.current_quantity)
              return (
                <div className="reorder-card" key={item.id}>
                  <div className="reorder-body">
                    <div className="item-name">{item.name}</div>
                    <div className="reorder-detail">
                      {item.current_quantity} on hand · reorder at {item.reorder_threshold} {item.unit}
                    </div>
                  </div>
                  <span className="short-pill">Short {short} {item.unit}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      <Toast message={toast} />
    </div>
  )
}
