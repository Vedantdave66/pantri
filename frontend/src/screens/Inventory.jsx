import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { CATEGORIES, groupByCategory, categoryColor } from '../constants.js'
import ItemFormSheet from '../components/ItemFormSheet.jsx'

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
      const data = await api.listItems()
      setItems(data)
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
        </div>
      </header>

      <div className="search-bar-wrap">
        <input
          className="search-bar"
          placeholder="Search items…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="chips-row">
        {['All', ...CATEGORIES].map((c) => (
          <button
            key={c}
            className={`chip ${filter === c ? 'active' : ''}`}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {error && <div className="banner-error">{error}</div>}

      {items === null ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : grouped.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">No items found</div>
          <div className="empty-subtitle">Tap + to add your first inventory item.</div>
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.category}>
            <div className="category-title">{group.category}</div>
            <div className="card-list">
              {group.items.map((item) => {
                const low = item.current_quantity <= item.reorder_threshold
                return (
                  <button
                    key={item.id}
                    className="item-card"
                    onClick={() => setEditingItem(item)}
                  >
                    <span
                      className="category-dot"
                      style={{ background: categoryColor(item.category) }}
                    />
                    <div className="item-info">
                      <div className="item-name">{item.name}</div>
                      <div className="item-unit">{item.unit}</div>
                    </div>
                    <span className={`qty-pill ${low ? 'low' : 'ok'}`}>
                      {item.current_quantity} {item.unit}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))
      )}

      <button className="fab" onClick={() => setShowAdd(true)} aria-label="Add Item">+</button>

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
