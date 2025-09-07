import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

import Login from './Login.jsx'
import Register from './Register.jsx'
import Profile from './Profile.jsx'
import Recommendations from './Recommendations.jsx'
import AdminUsers from './AdminUsers.jsx'

import { getProfile } from './api.js'
import '../../styles/auth.css'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const hasToken = !!localStorage.getItem('auth_token')

  const [myRole, setMyRole] = useState(null)

  // učitaj rolu nakon logina
  useEffect(() => {
    if (!hasToken) {
      setMyRole(null)
      return
    }
    ;(async () => {
      try {
        const me = await getProfile()
        const r = (me?.role ?? me?.Role ?? '').toString().toLowerCase()
        setMyRole(r || null)
      } catch {
        setMyRole(null)
      }
    })()
  }, [hasToken])

  // ako je admin i sleti na /profile ili /recommendations -> preusmeri na /admin/users
  useEffect(() => {
    if (
      hasToken &&
      myRole === 'admin' &&
      (location.pathname === '/profile' || location.pathname === '/recommendations')
    ) {
      navigate('/admin/users', { replace: true })
    }
  }, [hasToken, myRole, location.pathname, navigate])

  function onLogout() {
    try { localStorage.removeItem('auth_token') } catch {}
    setMyRole(null)
    navigate('/login', { replace: true })
  }

  const isAdmin = myRole === 'admin'

  return (
    <div className="auth-wrap">
      {/* proširi karticu kad je admin */}
      <div className={`card ${isAdmin ? 'card-wide' : ''}`}>
        <h2 className="title">Welcome</h2>

        <nav className="tabs" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {!hasToken ? (
            <>
              <Link to="/login" aria-current={location.pathname === '/login' ? 'page' : undefined}>
                Login
              </Link>
              <Link to="/register" aria-current={location.pathname === '/register' ? 'page' : undefined}>
                Register
              </Link>
            </>
          ) : (
            <>
              {/* ADMIN vidi SAMO Users */}
              {isAdmin ? (
                <Link
                  to="/admin/users"
                  aria-current={location.pathname.startsWith('/admin/users') ? 'page' : undefined}
                >
                  Users
                </Link>
              ) : (
                <>
                  {/* OSTALI vide Profile i Recommendations */}
                  <Link
                    to="/profile"
                    aria-current={location.pathname === '/profile' ? 'page' : undefined}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/recommendations"
                    aria-current={location.pathname === '/recommendations' ? 'page' : undefined}
                  >
                    Recommendations
                  </Link>
                </>
              )}

              <span style={{ flex: 1 }} />
              <button className="button" onClick={onLogout}>Logout</button>
            </>
          )}
        </nav>

        <div className="grid">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* rute za ne-admin korisnike */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/recommendations" element={<Recommendations />} />

            {/* admin stranica */}
            <Route path="/admin/users" element={<AdminUsers />} />

            {/* fallback */}
            <Route
              path="*"
              element={
                isAdmin
                  ? <Navigate to="/admin/users" replace />
                  : hasToken
                    ? <Navigate to="/recommendations" replace />
                    : <Navigate to="/login" replace />
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  )
}
