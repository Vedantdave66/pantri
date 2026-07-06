import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { timeAgo } from '../constants.js'
import Avatar from '../components/Avatar.jsx'
import BottomSheet from '../components/BottomSheet.jsx'

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
      setError('PIN must be exactly 4 digits')
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
    <BottomSheet title="Add Staff Member" onClose={onClose}>
      <form className="sheet-form" onSubmit={handleSubmit}>
        {error && <div className="error-text">{error}</div>}

        <div>
          <label className="field-label" htmlFor="staff-name">Full name</label>
          <input
            id="staff-name"
            className="text-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Harpreet Singh"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="staff-pin">4-digit PIN</label>
          <input
            id="staff-pin"
            className="text-input pin-input"
            inputMode="numeric"
            pattern="\d*"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
          />
        </div>

        <div className="sheet-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create Account'}
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
    await api.deleteEmployee(selected.id)
    setSelected(null)
    load()
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h1 className="screen-title">Staff</h1>
        </div>
      </header>

      {error && <div className="banner-error">{error}</div>}

      {employees === null ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : employees.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">No staff yet</div>
          <div className="empty-subtitle">
            Add a staff member so they can submit daily counts with a PIN.
          </div>
        </div>
      ) : (
        <div className="card-list">
          {employees.map((emp) => (
            <button className="staff-row" key={emp.id} onClick={() => setSelected(emp)}>
              <Avatar name={emp.full_name} />
              <div className="activity-info">
                <div className="activity-name">{emp.full_name}</div>
                <div className="activity-time">
                  {emp.last_active
                    ? `Last active ${timeAgo(emp.last_active)}`
                    : 'Never logged in'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="staff-add-wrap">
        <button className="btn-secondary" onClick={() => setShowAdd(true)}>
          + Add Staff Member
        </button>
      </div>

      {showAdd && <AddStaffSheet onClose={() => setShowAdd(false)} onCreate={handleCreate} />}

      {selected && (
        <BottomSheet title={selected.full_name} onClose={() => setSelected(null)}>
          <div className="sheet-form">
            <div className="activity-time">
              {selected.last_active
                ? `Last active ${timeAgo(selected.last_active)}`
                : 'Never logged in'}
            </div>
            <div className="sheet-actions">
              <button className="btn-text-danger" onClick={handleDelete}>
                Remove Staff Member
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
