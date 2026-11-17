const KEY = 'epg_token'
export const getToken = () => localStorage.getItem(KEY)
export const setToken = (t) => (t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY))

async function call(url, opts = {}) {
  const token = getToken()
  const res = await fetch(url, {
    ...opts,
    headers: { ...(opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body && !(opts.body instanceof FormData) ? JSON.stringify(opts.body) : opts.body,
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || 'Error inesperado')
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  content: () => call('/api/content'),
  login: (user, password) => call('/api/login', { method: 'POST', body: { user, password } }),
  me: () => call('/api/me'),
  users: () => call('/api/users'),
  createUser: (body) => call('/api/users', { method: 'POST', body }),
  updateUser: (id, body) => call(`/api/users/${id}`, { method: 'PUT', body }),
  removeUser: (id) => call(`/api/users/${id}`, { method: 'DELETE' }),
  adminContent: () => call('/api/admin/content'),
  create: (col, body) => call(`/api/admin/${col}`, { method: 'POST', body }),
  update: (col, id, body) => call(`/api/admin/${col}/${id}`, { method: 'PUT', body }),
  remove: (col, id) => call(`/api/admin/${col}/${id}`, { method: 'DELETE' }),
  saveSettings: (body) => call('/api/admin/settings', { method: 'PUT', body }),
  upload: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return call('/api/admin/upload', { method: 'POST', body: fd })
  },
}
