import { Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

import Login from './Login.jsx'
import Register from './Register.jsx'
import Profile from './Profile.jsx'
import Recommendations from './Recommendations.jsx'
import AdminUsers from './AdminUsers.jsx'
import BlogFeed from './blog/BlogFeed.jsx'
import BlogDetails from './blog/BlogDetails.jsx'
import CreateBlog from './blog/CreateBlog.jsx'         // ⟵ DODATO
import ToursList from '../tours/ToursList.jsx'
import CreateTour from '../tours/CreateTour.jsx'
import TourDetails from '../tours/TourDetails.jsx';
import PositionSimulator from '../position/PositionSimulator.jsx';

import { getProfile } from './api.js'
import '../../styles/auth.css'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [myRole, setMyRole] = useState(null)

  // Recompute token on mount and after login/logout (localStorage event safety)
  const hasToken = !!localStorage.getItem('auth_token')

  useEffect(() => {
    if (!hasToken) { setMyRole(null); return }
    (async () => {
      try {
        const me = await getProfile()
        const r = (me?.role ?? me?.Role ?? '').toString().toLowerCase()
        setMyRole(r || null)
      } catch {
        setMyRole(null)
      }
    })()
  }, [hasToken])

  useEffect(() => {
    if (hasToken && myRole === 'admin' &&
        (location.pathname === '/profile' || location.pathname === '/recommendations')) {
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
      <div className={`card ${isAdmin ? 'card-wide' : ''}`}>

        {/* Header row */}
        <div className="card-header" style={{display:'flex', alignItems:'center', gap:12}}>
          <h2 className="title" style={{margin:0, lineHeight:1}}>Welcome</h2>
        </div>

        {/* Nav row */}
        <nav className="tabs"
             style={{display:'flex', alignItems:'center', gap:12, marginTop:12}}>
          {!hasToken ? (
            <>
              <Nav className="tab" to="/login">Login</Nav>
              <Nav className="tab" to="/register">Register</Nav>
            </>
          ) : (
            <>
              {isAdmin ? (
                <Nav className="tab" to="/admin/users">Users</Nav>
              ) : (
                <>
                  <Nav className="tab" to="/profile">Profile</Nav>
                  <Nav className="tab" to="/recommendations">Recommendations</Nav>
                  <Nav className="tab" to="/blog" end>Blog</Nav>
                  <Nav className="tab" to="/blog/new">Create Blog</Nav> {/* ⟵ DODATO */}
                </>
              )}

              <Nav className="tab" to="/tours" end>Tours</Nav>
              <Nav className="tab" to="/tours/new">Create Tour</Nav>

              <span style={{marginLeft:'auto'}} />
              <button className="button" style={{lineHeight:1}} onClick={onLogout}>
                Logout
              </button>
            </>
          )}
        </nav>

        {/* Content */}
        <div className="grid">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/profile" element={<Profile />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/blog" element={<BlogFeed />} />
            <Route path="/blog/new" element={<CreateBlog />} />   {/* ⟵ DODATO */}
            <Route path="/blog/:id" element={<BlogDetails />} />

            <Route path="/admin/users" element={<AdminUsers />} />

            <Route path="/tours" element={<ToursList />} />
            <Route path="/tours/new" element={<CreateTour />} />

            <Route path="/tours/:id" element={<TourDetails/>} />
            <Route path="/position-simulator" element={<PositionSimulator/>} />

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

/* Small helper so tabs get an active class and align nicely */
function Nav({ to, end, className = 'tab', children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `${className} ${isActive ? 'tab--active' : ''}`
      }
    >
      {children}
    </NavLink>
  )
}
