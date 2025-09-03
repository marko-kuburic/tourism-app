import { useState } from 'react'
import { register } from './api.js'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('tourist')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    try {
      await register({ username, email, password, role })
      setSuccess(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid">
      <input className="input" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
      <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} type="email" required />
      <input className="input" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} type="password" required />
      <select className="input" value={role} onChange={e => setRole(e.target.value)}>
        <option value="tourist">Tourist</option>
        <option value="guide">Guide</option>
      </select>
      <button className="button" disabled={loading} type="submit">{loading ? 'Creating…' : 'Register'}</button>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">Registered successfully.</p>}
    </form>
  )
}


