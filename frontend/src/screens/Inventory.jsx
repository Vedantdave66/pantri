import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { groupByCategory, formatToday } from '../constants.js'
import ItemFormSheet from '../components/ItemFormSheet.jsx'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.listItems()
      setItems(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.trim().toLowerCase()
    return items.filter((i) => i.name.toLowerCase().includes(q))
  }, [items, query])

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
          <h1 className="screen-title">Pantri</h1>
          <div className="screen-date">{formatToday()}</div>
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

      {error && <div className="banner-error">{error}</div>}

      {loading ? (
        <div className="loading-wrap">Loading…</div>
      ) : grouped.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No items yet</div>
          <div>Tap + to add your first inventory item.</div>
        </div>
      ) : (
        grouped.map((group) => (
          <div className="category-group" key={group.category}>
            <div className="category-title">{group.category}</div>
            <div className="item-list">
              {group.items.map((item) => {
                const low = item.current_quantity <= item.reorder_threshold
                return (
                  <button
                    key={item.id}
                    className="item-row"
                    onClick={() => setEditingItem(item)}
                  >
                    <div className="item-row-main">
                      <span className={`status-dot ${low ? 'low' : ''}`} />
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-qty">
                          {item.current_quantity} {item.unit}
                        </div>
                      </div>
                    </div>
                    {low && <span className="low-badge">LOW</span>}
                    <span className="chevron">›</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))
      )}

      <button className="fab" onClick={() => setShowAdd(true)} aria-label="Add Item">
        +
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
