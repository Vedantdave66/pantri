const API_URL = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'pantri_token'
const ROLE_KEY = 'pantri_role'
const NAME_KEY = 'pantri_name'

export function getSession() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  return {
    token,
    role: localStorage.getItem(ROLE_KEY) || 'owner',
    name: localStorage.getItem(NAME_KEY) || '',
  }
}

export function setSession({ token, role, name }) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROLE_KEY, role || 'owner')
  localStorage.setItem(NAME_KEY, name || '')
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(NAME_KEY)
}

async function request(path, options = {}) {
  const session = getSession()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (session) {
    headers.Authorization = `Bearer ${session.token}`
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401 && session) {
    clearSession()
    window.location.reload()
    return null
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      message = body.detail || message
    } catch {
      // ignore non-json error body
    }
    const error = new Error(message)
    error.status = res.status
    throw error
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  pinLogin: (pin) =>
    request('/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/me'),

  listItems: () => request('/api/items'),
  createItem: (item) =>
    request('/api/items', { method: 'POST', body: JSON.stringify(item) }),
  updateItem: (id, item) =>
    request(`/api/items/${id}`, { method: 'PATCH', body: JSON.stringify(item) }),
  deleteItem: (id) => request(`/api/items/${id}`, { method: 'DELETE' }),

  submitCounts: (counts, notes) =>
    request('/api/counts/submit', {
      method: 'POST',
      body: JSON.stringify({ counts, notes: notes || null }),
    }),
  myCountToday: () => request('/api/counts/mine/today'),
  countsToday: () => request('/api/counts/today'),
  countsLatest: () => request('/api/counts/latest'),

  reorderList: () => request('/api/reorder'),
  discrepancies: () => request('/api/discrepancies'),

  createEmployee: (full_name, pin) =>
    request('/api/auth/create-employee', {
      method: 'POST',
      body: JSON.stringify({ full_name, pin }),
    }),
  listEmployees: () => request('/api/employees'),
  deleteEmployee: (id) => request(`/api/employees/${id}`, { method: 'DELETE' }),
}
