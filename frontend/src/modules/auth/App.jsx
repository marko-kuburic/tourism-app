import { Routes, Route, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";  // Importuj useState i useEffect
import { getProfile, normalizeRole } from "./api";  // Importuj funkcije iz api.js

import Login from "./Login";
import Register from "./Register";
import Profile from "./Profile";
import Recommendations from "./Recommendations";
import AdminUsers from "./AdminUsers";
import BlogFeed from "./blog/BlogFeed";
import BlogDetails from "./blog/BlogDetails";
import TourListForTourist from "../tours/TourListForTourist";  // Importiraj komponentu za turiste
import TourDetails from "../tours/TourDetails";
import CreateTour from "../tours/CreateTour";
import PositionSimulator from "../position/PositionSimulator";
import ToursList from "../tours/ToursList";  // Importiraj komponentu za autore
import "../../styles/auth.css";
import Cart from '../purchase/Cart';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [myRole, setMyRole] = useState(null);
  const hasToken = !!localStorage.getItem('auth_token');

  // Učitaj profil sa servera kad postoji token
  useEffect(() => {
    if (!hasToken) { setMyRole(null); return; }
    (async () => {
      try {
        const me = await getProfile();
        setMyRole(normalizeRole(me));
      } catch {
        setMyRole(null);
      }
    })();
  }, [hasToken]);

  // Preusmeravanje ako je admin i pokušao na korisničke strane
  useEffect(() => {
    if (hasToken && myRole === 'admin' &&
        (location.pathname === '/profile' || location.pathname === '/recommendations')) {
      navigate('/admin/users', { replace: true });
    }
  }, [hasToken, myRole, location.pathname, navigate]);

  function onLogout() {
    try { localStorage.removeItem('auth_token'); } catch {}
    setMyRole(null);
    navigate('/login', { replace: true });
  }

  const isAdmin = myRole === 'admin';
  const isGuide = myRole === 'guide';
  const isTourist = myRole === 'tourist';

  return (
    <div className="auth-wrap">
      <div className={`card ${isAdmin ? 'card-wide' : ''}`}>

        {/* Header row */}
        <div className="card-header" style={{display:'flex', alignItems:'center', gap:12}}>
          <h2 className="title" style={{margin:0, lineHeight:1}}>Welcome</h2>
        </div>

        {/* Nav row */}
        <nav className="tabs" style={{display:'flex', alignItems:'center', gap:12, marginTop:12}}>
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
                </>
              )}

              {/* Hide Tours tab completely for admin */}
              {!isAdmin && (
                <Nav className="tab" to="/tours" end>Tours</Nav>
              )}
              {isTourist && (
                <Nav className="tab" to="/cart">Korpa</Nav>
              )}


              {/* Create Tour vidi samo guide ili admin */}
              {(isGuide) && (
                <Nav className="tab" to="/tours/new">Create Tour</Nav>
              )}

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
            <Route path="/blog/:id" element={<BlogDetails />} />
            <Route path="/cart" element={<Cart />} />
            {/* Admin rute – štitimo jednostavnim guardom */}
            <Route
              path="/admin/users"
              element={isAdmin ? <AdminUsers /> : <Navigate to="/admin/users" replace />}
            />

            {/* Ture: admin ne sme da vidi ni listu ni detalje */}
            <Route
              path="/tours"
              element={
                isAdmin
                  ? <Navigate to="/admin/users" replace />
                  : (isTourist ? <TourListForTourist /> : <ToursList />)
              }
            />
            <Route
              path="/tours/:id"
              element={
                isAdmin
                  ? <Navigate to="/admin/users" replace />
                  : <TourDetails />
              }
            />

            {/* Kreiranje ture: samo guide/admin */}
            <Route
              path="/tours/new"
              element={(isGuide || isAdmin) ? <CreateTour /> : <Navigate to="/tours" replace />}
            />

            <Route path="/position-simulator" element={<PositionSimulator />} />

            {/* Fallback: preusmeravanje na odgovarajuće stranice po ulozi */}
            <Route
              path="*"
              element={
                isAdmin
                  ? <Navigate to="/admin/users" replace />
                  : isGuide
                    ? <Navigate to="/recommendations" replace />
                    : hasToken
                      ? <Navigate to="/tours" replace />
                      : <Navigate to="/login" replace />
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// Small helper so tabs get an active class and align nicely
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
  );
}
