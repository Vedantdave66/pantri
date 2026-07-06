import { useState } from 'react'
import { api, setSession } from '../api.js'
import { greeting } from '../constants.js'
import { BackspaceIcon } from '../components/Icons.jsx'
import Avatar from '../components/Avatar.jsx'
import { buzz } from '../haptics.js'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', 'back']

export default function PinLogin({ onLoggedIn, onManagerLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [shake, setShake] = useState(false)
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
      setError(err.message || 'Incorrect PIN')
      setPin('')
      setChecking(false)
      setShake(true)
      setTimeout(() => setShake(false), 400)
    }
  }

  const press = (key) => {
    if (checking) return
    buzz(7)
    if (key === 'back') {
      setPin((p) => p.slice(0, -1))
      setError('')
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
        <div className="pin-welcome">
          <Avatar name={welcome} />
          <div className="pin-welcome-name">{greeting()}, {welcome.split(' ')[0]}</div>
          <div className="pin-welcome-sub">Opening today's count</div>
        </div>
      </div>
    )
  }

  return (
    <div className="pin-screen">
      <h1 className="pin-title">Staff sign in</h1>
      <div className="pin-label">Enter your 4-digit PIN</div>

      <div className={`pin-dots ${shake ? 'shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`} />
        ))}
      </div>

      <div className="pin-error">
        {error && <span className="error-text">{error}</span>}
        {checking && <span className="spinner" style={{ width: 18, height: 18, display: 'inline-block' }} />}
      </div>

      <div className="pin-pad">
        {KEYS.map((key, i) =>
          key === null ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              className={`pin-key ${key === 'back' ? 'ghost' : ''}`}
              onClick={() => press(key)}
              aria-label={key === 'back' ? 'Delete digit' : key}
            >
              {key === 'back' ? <BackspaceIcon size={24} /> : key}
            </button>
          )
        )}
      </div>

      <button className="login-alt-link" onClick={onManagerLogin}>
        Manager sign in
      </button>
    </div>
  )
}
