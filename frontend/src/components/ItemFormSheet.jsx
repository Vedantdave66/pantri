import { useState } from 'react'
import BottomSheet from './BottomSheet.jsx'
import { CATEGORIES } from '../constants.js'

export default function ItemFormSheet({ item, onClose, onSave, onDelete }) {
  const isEdit = Boolean(item)
  const [name, setName] = useState(item?.name || '')
  const [unit, setUnit] = useState(item?.unit || '')
  const [category, setCategory] = useState(item?.category || CATEGORIES[0])
  const [threshold, setThreshold] = useState(
    item?.reorder_threshold != null ? String(item.reorder_threshold) : '1'
  )
  const [expected, setExpected] = useState(
    item?.expected_quantity != null ? String(item.expected_quantity) : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !unit.trim()) {
      setError('Name and unit are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        name: name.trim(),
        unit: unit.trim(),
        category,
        reorder_threshold: Number(threshold) || 0,
        expected_quantity: expected === '' ? null : Number(expected),
      })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <BottomSheet title={isEdit ? item.name : 'Add Item'} onClose={onClose}>
      <form className="sheet-form" onSubmit={handleSubmit}>
        {error && <div className="error-text">{error}</div>}

        <div>
          <label className="field-label" htmlFor="item-name">Name</label>
          <input
            id="item-name"
            className="text-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Basmati Rice"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="item-unit">Unit</label>
          <input
            id="item-unit"
            className="text-input"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. bags, lbs, cases"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="item-category">Category</label>
          <select
            id="item-category"
            className="field-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="item-threshold">Reorder threshold</label>
          <input
            id="item-threshold"
            className="text-input"
            type="number"
            inputMode="decimal"
            min="0"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="item-expected">
            Expected quantity (for discrepancy alerts, optional)
          </label>
          <input
            id="item-expected"
            className="text-input"
            type="number"
            inputMode="decimal"
            min="0"
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            placeholder="Leave blank to skip checks"
          />
        </div>

        <div className="sheet-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Add Item'}
          </button>
          {isEdit && (
            <button
              type="button"
              className="btn-text-danger"
              disabled={saving}
              onClick={() => onDelete && onDelete()}
            >
              Delete Item
            </button>
          )}
        </div>
      </form>
    </BottomSheet>
  )
}
