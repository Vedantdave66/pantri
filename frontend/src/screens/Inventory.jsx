import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { CATEGORIES, groupByCategory, categoryColor } from '../constants.js'
import ItemFormSheet from '../components/ItemFormSheet.jsx'
import { SkeletonList } from '../components/Skeleton.jsx'
import { SearchIcon, ChevronIcon, PlusIcon, BoxIcon } from '../components/Icons.jsx'

function tint(hex) {
  return `color-mix(in srgb, ${hex} 13%, white)`
}

export default function Inventory({ addSignal }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const load = async () => {
    setError('')
    try {
      setItems(await api.listItems())
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (addSignal) setShowAdd(true)
  }, [addSignal])

  const counts = useMemo(() => {
    const map = { All: items?.length || 0 }
    for (const c of CATEGORIES) {
      map[c] = items ? items.filter((i) => i.category === c).length : 0
    }
    return map
  }, [items])

  const filtered = useMemo(() => {
    if (!items) return []
    let list = items
    if (filter !== 'All') list = list.filter((i) => i.category === filter)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((i) => i.name.toLowerCase().includes(q))
    }
    return list
  }, [items, query, filter])

  const grouped = useMemo(() => groupByCategory(filtered), [filtered])

  const handleAdd = async (payload) => {
    const created = await api.createItem(payload)
    setItems((prev) => [...prev, created])
    setShowAdd(false)
  }

  const handleUpdate = async (payload) => {
    const updated = await api.updateItem(editingItem.id, payload)
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    setEditingItem(null)
  }

  const handleDelete = async () => {
    await api.deleteItem(editingItem.id)
    setItems((prev) => prev.filter((i) => i.id !== editingItem.id))
    setEditingItem(null)
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">Inventory</h1>
          <div className="screen-subtitle">
            {items ? `${items.length} items tracked` : 'Loading…'}
          </div>
        </div>
      </header>

      <div className="search-bar-wrap">
        <input
          className="search-bar"
          placeholder="Search items…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="search-icon"><SearchIcon size={19} /></span>
      </div>

      <div className="chips-row">
        {['All', ...CATEGORIES].map((c) => (
          <button
            key={c}
            className={`chip ${filter === c ? 'active' : ''}`}
            onClick={() => setFilter(c)}
          >
            {c}
            {counts[c] > 0 && <span className="chip-count">{counts[c]}</span>}
          </button>
        ))}
      </div>

      {error && <div className="banner-error">{error}</div>}

      {items === null ? (
        <SkeletonList rows={5} height={74} />
      ) : grouped.length === 0 ? (
        <div className="empty-state">
          <div className="empty-check" style={{ background: 'var(--saffron-soft)', color: 'var(--saffron-deep)' }}>
            <BoxIcon size={38} />
          </div>
          <div className="empty-title">Nothing here</div>
          <div className="empty-subtitle">
            {query || filter !== 'All'
              ? 'Try a different search or filter.'
              : 'Tap + to add your first inventory item.'}
          </div>
        </div>
      ) : (
        (() => {
          let runningIndex = 0
          return grouped.map((group) => {
            const groupStart = runningIndex
            runningIndex += group.items.length
            return (
              <div key={group.category}>
                <div className="category-title">{group.category}</div>
                <div className="card-list">
                  {group.items.map((item, i) => {
                    const low = item.current_quantity <= item.reorder_threshold
                    const color = categoryColor(item.category)
                    return (
                      <button
                        key={item.id}
                        className="item-card rise"
                        style={{ '--i': groupStart + i }}
                        onClick={() => setEditingItem(item)}
                      >
                        <span className="category-ring" style={{ '--ring-soft': tint(color) }}>
                          <span className="category-dot" style={{ background: color }} />
                        </span>
                        <div className="item-info">
                          <div className="item-name">{item.name}</div>
                          <div className="item-unit">{item.unit}</div>
                        </div>
                        <span className={`qty-pill ${low ? 'low' : 'ok'}`}>
                          {low && <span className="low-dot" />}
                          {item.current_quantity} {item.unit}
                        </span>
                        <span className="item-chevron"><ChevronIcon size={18} /></span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })
        })()
      )}

      <button className="fab" onClick={() => setShowAdd(true)} aria-label="Add Item">
        <PlusIcon size={26} strokeWidth={2.2} />
      </button>

      {showAdd && (
        <ItemFormSheet onClose={() => setShowAdd(false)} onSave={handleAdd} />
      )}

      {editingItem && (
        <ItemFormSheet
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
