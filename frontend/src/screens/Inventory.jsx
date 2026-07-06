import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { CATEGORIES, groupByCategory } from '../constants.js'
import ItemFormSheet from '../components/ItemFormSheet.jsx'
import { SkeletonList } from '../components/Skeleton.jsx'
import { SearchIcon, ChevronIcon, PlusIcon } from '../components/Icons.jsx'

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
          {items && <div className="screen-subtitle">{items.length} items</div>}
        </div>
      </header>

      <div className="search-bar-wrap">
        <input
          className="search-bar"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="search-icon"><SearchIcon size={18} /></span>
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
        <SkeletonList rows={6} height={56} />
      ) : grouped.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Nothing here</div>
          <div className="empty-subtitle">
            {query || filter !== 'All'
              ? 'Try a different search or filter.'
              : 'Add your first item with the + button.'}
          </div>
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.category}>
            <div className="group-label">{group.category}</div>
            <div className="list-group">
              {group.items.map((item) => {
                const low = item.current_quantity <= item.reorder_threshold
                return (
                  <button
                    key={item.id}
                    className="list-row"
                    onClick={() => setEditingItem(item)}
                  >
                    <div className="row-main">
                      <div className="row-title">{item.name}</div>
                      <div className="row-sub">par {item.reorder_threshold}</div>
                    </div>
                    <div className="row-meta">
                      <div className={`row-qty ${low ? 'low' : ''}`}>
                        {item.current_quantity} {item.unit}
                      </div>
                      {low && <div className="row-low-tag">Below par</div>}
                    </div>
                    <span className="row-chevron"><ChevronIcon size={17} /></span>
                  </button>
                )
              })}
            </div>
          </div>
        ))
      )}

      <button className="fab" onClick={() => setShowAdd(true)} aria-label="Add item">
        <PlusIcon size={24} strokeWidth={2} />
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
