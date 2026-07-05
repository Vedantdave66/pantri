const API_URL = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'pantri_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

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
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  listItems: () => request('/api/items'),
  createItem: (item) =>
    request('/api/items', { method: 'POST', body: JSON.stringify(item) }),
  updateItem: (id, item) =>
    request(`/api/items/${id}`, { method: 'PATCH', body: JSON.stringify(item) }),
  deleteItem: (id) => request(`/api/items/${id}`, { method: 'DELETE' }),
  countItem: (id, new_quantity) =>
    request(`/api/items/${id}/count`, {
      method: 'POST',
      body: JSON.stringify({ new_quantity }),
    }),
  reorderList: () => request('/api/reorder'),
}
