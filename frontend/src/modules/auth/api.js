const isDev = import.meta && import.meta.env && import.meta.env.DEV
const apiBaseUrl = isDev ? '/api' : ((import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8081')

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

export async function login(payload) {
  const res = await fetch(`${apiBaseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    let err = {}
    try { err = await res.json() } catch {}
    throw new Error(err.error || `Login failed (${res.status})`)
  }
  return res.json()
}

export async function register(payload) {
  const res = await fetch(`${apiBaseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    let err = {}
    try { err = await res.json() } catch {}
    throw new Error(err.error || `Register failed (${res.status})`)
  }
  return res.json()
}

export async function getProfile() {
  const res = await fetch(`${apiBaseUrl}/me`, {
    method: 'GET',
    headers: getAuthHeaders()
  })
  if (!res.ok) {
    let err = {}
    try { err = await res.json() } catch {}
    throw new Error(err.error || `Failed to fetch profile (${res.status})`)
  }
  return res.json()
}

export async function updateProfile(payload) {
  const res = await fetch(`${apiBaseUrl}/me`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    let err = {}
    try { err = await res.json() } catch {}
    throw new Error(err.error || `Failed to update profile (${res.status})`)
  }
  return res.json()
}


