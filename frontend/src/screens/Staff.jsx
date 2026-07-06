import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { timeAgo } from '../constants.js'
import Avatar from '../components/Avatar.jsx'
import BottomSheet from '../components/BottomSheet.jsx'
import { SkeletonList } from '../components/Skeleton.jsx'
import { PlusIcon, TrashIcon, ChevronIcon } from '../components/Icons.jsx'

function AddStaffSheet({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be 4 digits')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onCreate(name.trim(), pin)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <BottomSheet title="Add staff member" onClose={onClose}>
      <form className="sheet-form" onSubmit={handleSubmit}>
        {error && <div className="error-text">{error}</div>}

        <div>
          <label className="field-label" htmlFor="staff-name">Full name</label>
          <input
            id="staff-name"
            className="text-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="staff-pin">PIN</label>
          <input
            id="staff-pin"
            className="text-input pin-input"
            inputMode="numeric"
            pattern="\d*"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="0000"
          />
          <div className="field-hint">They'll use this 4-digit PIN to sign in</div>
        </div>

        <div className="sheet-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving && <span className="btn-spinner" />}
            {saving ? 'Creating' : 'Create account'}
          </button>
        </div>
      </form>
    </BottomSheet>
  )
}

export default function Staff() {
  const [employees, setEmployees] = useState(null)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = async () => {
    setError('')
    try {
      setEmployees(await api.listEmployees())
    } catch (err) {
      setError(err.message)
      setEmployees([])
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (name, pin) => {
    await api.createEmployee(name, pin)
    setShowAdd(false)
    load()
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    await api.deleteEmployee(selected.id)
    setSelected(null)
    setConfirmDelete(false)
    load()
  }

  const closeDetail = () => {
    setSelected(null)
    setConfirmDelete(false)
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">Staff</h1>
          {employees && (
            <div className="screen-subtitle">
              {employees.length} {employees.length === 1 ? 'person' : 'people'}
            </div>
          )}
        </div>
      </header>

      {error && <div className="banner-error">{error}</div>}

      {employees === null ? (
        <SkeletonList rows={3} height={56} />
      ) : employees.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">No staff yet</div>
          <div className="empty-subtitle">
            Add someone so they can submit counts with a PIN.
          </div>
        </div>
      ) : (
        <div className="list-group">
          {employees.map((emp) => (
            <button className="list-row" key={emp.id} onClick={() => setSelected(emp)}>
              <Avatar name={emp.full_name} />
              <div className="row-main">
                <div className="row-title">{emp.full_name}</div>
                <div className="row-sub">
                  {emp.last_active
                    ? `Last count ${timeAgo(emp.last_active)}`
                    : 'Hasn’t signed in yet'}
                </div>
              </div>
              <span className="row-chevron"><ChevronIcon size={17} /></span>
            </button>
          ))}
        </div>
      )}

      <div className="staff-add-wrap">
        <button className="btn-secondary" onClick={() => setShowAdd(true)}>
          <PlusIcon size={18} strokeWidth={2} /> Add staff member
        </button>
      </div>

      {showAdd && <AddStaffSheet onClose={() => setShowAdd(false)} onCreate={handleCreate} />}

      {selected && (
        <BottomSheet onClose={closeDetail}>
          <div className="account-sheet-head">
            <Avatar name={selected.full_name} />
            <div>
              <div className="account-name">{selected.full_name}</div>
              <div className="account-role">
                {selected.last_active
                  ? `Last count ${timeAgo(selected.last_active)}`
                  : 'Hasn’t signed in yet'}
              </div>
            </div>
          </div>
          <div className="sheet-actions">
            <button className="btn-text-danger" onClick={handleDelete}>
              <TrashIcon size={17} />
              {confirmDelete ? 'Tap again to confirm' : 'Remove'}
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
