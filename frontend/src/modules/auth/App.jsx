import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import Login from './Login.jsx'
import Register from './Register.jsx'
import Profile from './Profile.jsx'
import Recommendations from './Recommendations.jsx'
import '../../styles/auth.css'

export default function App() {
  const location = useLocation()
  const hasToken = localStorage.getItem('auth_token')
  
  return (
    <div className="auth-wrap">
      <div className="card">
        <h2 className="title">Welcome</h2>
        <nav className="tabs">
          {!hasToken ? (
            <>
              <Link to="/login" aria-current={location.pathname === '/login' ? 'page' : undefined}>Login</Link>
              <Link to="/register" aria-current={location.pathname === '/register' ? 'page' : undefined}>Register</Link>
            </>
          ) : (
            <>
              <Link to="/profile" aria-current={location.pathname === '/profile' ? 'page' : undefined}>Profile</Link>
              <Link to="/recommendations" aria-current={location.pathname === '/recommendations' ? 'page' : undefined}>Recommendations</Link>
            </>
          )}
        </nav>
        <div className="grid">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="*" element={<Navigate to={hasToken ? "/recommendations" : "/login"} replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}


