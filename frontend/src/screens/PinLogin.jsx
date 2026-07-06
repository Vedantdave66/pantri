import { useState } from 'react'
import { api, setSession } from '../api.js'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

export default function PinLogin({ onLoggedIn, onManagerLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [welcome, setWelcome] = useState('')

  const submit = async (fullPin) => {
    setChecking(true)
    setError('')
    try {
      const result = await api.pinLogin(fullPin)
      setSession({
        token: result.access_token,
        role: 'employee',
        name: result.user.full_name || '',
      })
      setWelcome(result.user.full_name || 'Welcome')
      setTimeout(onLoggedIn, 900)
    } catch (err) {
      setError(err.message || 'Invalid PIN')
      setPin('')
      setChecking(false)
    }
  }

  const press = (key) => {
    if (checking) return
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1))
      return
    }
    if (!key || pin.length >= 4) return
    const next = pin + key
    setPin(next)
    if (next.length === 4) submit(next)
  }

  if (welcome) {
    return (
      <div className="pin-screen">
        <div className="pin-welcome">Hi, {welcome} 👋</div>
      </div>
    )
  }

  return (
    <div className="pin-screen">
      <h1 className="pin-title">Staff Login</h1>
      <div className="pin-label">Enter your 4-digit PIN</div>

      <div className="pin-dots">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`} />
        ))}
      </div>

      {error && <div className="error-text" style={{ marginBottom: 16 }}>{error}</div>}
      {checking && <div className="spinner" style={{ marginBottom: 16 }} />}

      <div className="pin-pad">
        {KEYS.map((key, i) => (
          <button
            key={i}
            className={`pin-key ${key === '' ? 'ghost' : ''}`}
            onClick={() => press(key)}
            disabled={key === ''}
          >
            {key}
          </button>
        ))}
      </div>

      <button className="login-alt-link" onClick={onManagerLogin}>
        Manager login →
      </button>
    </div>
  )
}
