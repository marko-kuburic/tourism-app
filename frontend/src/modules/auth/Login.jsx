// frontend/src/modules/auth/Login.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getProfile } from './api.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [token, setToken] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem('auth_token')
    if (saved) setToken(saved)
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // login → token
      const { token } = await login({ email, password })
      setToken(token)
      try { localStorage.setItem('auth_token', token) } catch {}

      // profil → role
      const profile = await getProfile()
      const role = String(profile?.role ?? profile?.Role ?? '')
        .trim()
        .toLowerCase()

      // admin odmah na /admin/users, ostali na /profile
      navigate(role === 'admin' ? '/admin/users' : '/profile', { replace: true })
    } catch (e) {
      setError(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid">
      <input
        className="input"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        type="email"
        required
      />
      <input
        className="input"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        type="password"
        required
      />
      <button className="button" disabled={loading} type="submit">
        {loading ? 'Signing in…' : 'Login'}
      </button>
      {error && <p className="error">{error}</p>}
      {token && <p className="success">Logged in successfully! Redirecting...</p>}
    </form>
  )
}
