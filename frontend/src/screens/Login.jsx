import { useState } from 'react'
import { api, setSession } from '../api.js'
import { LogoMark } from '../components/Icons.jsx'

export default function Login({ onLoggedIn, onStaffLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api.login(email.trim(), password)
      setSession({
        token: result.access_token,
        role: result.user.role,
        name: result.user.full_name || '',
      })
      onLoggedIn()
    } catch (err) {
      setError(err.message || 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-hero rise" style={{ '--i': 0 }}>
        <span className="logo-mark float-soft"><LogoMark size={72} /></span>
        <div className="login-wordmark">Pantri</div>
        <div className="login-subtitle">Smart inventory for restaurants</div>
      </div>

      <form className="login-card rise" style={{ '--i': 2 }} onSubmit={handleSubmit}>
        {error && <div className="error-text">{error}</div>}

        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="text-input"
            type="email"
            autoComplete="username"
            placeholder="you@restaurant.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="field-label" htmlFor="password">Password</label>
          <input
            id="password"
            className="text-input"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading && <span className="btn-spinner" />}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <button className="login-alt-link rise" style={{ '--i': 4 }} onClick={onStaffLogin}>
        Staff member? Use PIN →
      </button>
    </div>
  )
}
