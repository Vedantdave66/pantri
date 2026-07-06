import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { dailyPick } from '../constants.js'
import Toast from '../components/Toast.jsx'
import { SkeletonList } from '../components/Skeleton.jsx'
import { ShareIcon, CheckIcon, ChevronIcon } from '../components/Icons.jsx'

const STOCKED_LINES = [
  'Nothing to order',
  'The walk-in thanks you',
  'Sysco can wait a day',
  'Everything at par or better',
]

const MINI_CONFETTI = [
  { left: '30%', color: '#2D6A4F', size: 7, dx: -14, rot: 260, delay: 0, dur: 1.4, round: true },
  { left: '42%', color: '#E98A2B', size: 8, dx: 10, rot: 320, delay: 0.08, dur: 1.5, round: false },
  { left: '52%', color: '#3B8765', size: 6, dx: -8, rot: 280, delay: 0.16, dur: 1.3, round: false },
  { left: '60%', color: '#F4A535', size: 7, dx: 16, rot: 340, delay: 0.05, dur: 1.6, round: true },
  { left: '70%', color: '#2D6A4F', size: 6, dx: -12, rot: 300, delay: 0.22, dur: 1.4, round: false },
  { left: '38%', color: '#E76F51', size: 6, dx: 8, rot: 270, delay: 0.3, dur: 1.5, round: true },
]

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
      setToast('Copied')
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
              <ChevronIcon size={15} /> Back
            </button>
          )}
          <h1 className="screen-title">Reorder</h1>
        </div>
        {items && items.length > 0 && (
          <button className="header-action" onClick={handleShare}>
            <ShareIcon size={16} /> Share
          </button>
        )}
      </header>

      {error && <div className="banner-error">{error}</div>}

      {items === null ? (
        <SkeletonList rows={3} height={56} />
      ) : items.length === 0 ? (
        <div className="empty-state">
          {MINI_CONFETTI.map((c, i) => (
            <span
              key={i}
              className="confetti mini"
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
          <div className="empty-icon"><CheckIcon size={30} strokeWidth={2.2} /></div>
          <div className="empty-title">Fully stocked</div>
          <div className="empty-subtitle">{dailyPick(STOCKED_LINES)}</div>
        </div>
      ) : (
        <>
          <div className="reorder-summary">
            {items.length} item{items.length === 1 ? '' : 's'} below par
          </div>
          <div className="list-group">
            {items.map((item) => {
              const need = Math.max(0, item.reorder_threshold - item.current_quantity)
              return (
                <div className="list-row" key={item.id}>
                  <div className="row-main">
                    <div className="row-title">{item.name}</div>
                    <div className="row-sub">
                      {item.current_quantity} on hand · par {item.reorder_threshold}
                    </div>
                  </div>
                  <span className="order-amount">
                    Order {need} {item.unit}
                  </span>
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
