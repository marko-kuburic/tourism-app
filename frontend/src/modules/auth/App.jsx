import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import Login from './Login.jsx'
import Register from './Register.jsx'
import Profile from './Profile.jsx'
import '../../styles/auth.css'

export default function App() {
  const location = useLocation()
  const hasToken = localStorage.getItem('auth_token')
  
  return (
    <div className="auth-wrap">
      <div className="card">
        <h2 className="title">Welcome</h2>
        {!hasToken && (
          <nav className="tabs">
            <Link to="/login" aria-current={location.pathname === '/login' ? 'page' : undefined}>Login</Link>
            <Link to="/register" aria-current={location.pathname === '/register' ? 'page' : undefined}>Register</Link>
          </nav>
        )}
        <div className="grid">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to={hasToken ? "/profile" : "/login"} replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}


