// import { useEffect, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { login, getProfile } from './api.js'

// export default function Login() {
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState(null)
//   const [token, setToken] = useState(null)
//   const navigate = useNavigate()

//   useEffect(() => {
//     const saved = localStorage.getItem('auth_token')
//     if (saved) setToken(saved)
//   }, [])

//   async function onSubmit(e) {
//     e.preventDefault()
//     setError(null)
//     setLoading(true)
//     try {
//       const { token } = await login({ email, password })
//       setToken(token)
//       try { localStorage.setItem('auth_token', token) } catch {}

//       const profile = await getProfile()
//       const role = String(profile?.role ?? profile?.Role ?? '')
//         .trim()
//         .toLowerCase()

//       navigate(role === 'admin' ? '/admin/users' : '/profile', { replace: true })
//     } catch (e) {
//       setError(e.message || 'Login failed')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <form onSubmit={onSubmit} className="grid">
//       <input
//         className="input"
//         placeholder="Email"
//         value={email}
//         onChange={e => setEmail(e.target.value)}
//         type="email"
//         required
//       />
//       <input
//         className="input"
//         placeholder="Password"
//         value={password}
//         onChange={e => setPassword(e.target.value)}
//         type="password"
//         required
//       />
//       <button className="button" disabled={loading} type="submit">
//         {loading ? 'Signing in…' : 'Login'}
//       </button>
//       {error && <p className="error">{error}</p>}
//       {token && <p className="success">Logged in successfully! Redirecting...</p>}
//     </form>
//   )
// }


import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getProfile } from './api.js'

// helper: pročitaj i normalizuj ulogu iz različitih formata
function normalizeRole(profile) {
  if (!profile) return ''
  const raw =
    profile.role ??
    profile.Role ??
    (Array.isArray(profile.roles) && profile.roles[0]) ??
    (Array.isArray(profile.authorities) && profile.authorities[0]?.authority) ??
    ''
  return String(raw).trim().toLowerCase().replace(/^role_/, '') // npr. ROLE_GUIDE -> 'guide'
}

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
      const { token } = await login({ email, password })
      setToken(token)
      try { localStorage.setItem('auth_token', token) } catch {}

      // Trigger custom event da App.jsx zna da je token promenjen
      window.dispatchEvent(new Event('auth-changed'))

      const profile = await getProfile().catch(() => null)
      const role = normalizeRole(profile)

      // različiti landing-i po ulozi:
      const target =
        role === 'admin'   ? '/admin/users' :
        role === 'guide'   ? '/author'      :
        role === 'tourist' ? '/tours'       :
                             '/tours'       // fallback

      navigate(target, { replace: true })
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

