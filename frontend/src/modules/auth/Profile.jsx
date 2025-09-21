import { useEffect, useState } from 'react'
import { getProfile } from './api.js'
import { Link } from 'react-router-dom'  

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getProfile()
        setProfile(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  function handleLogout() {
    localStorage.removeItem('auth_token')
    window.location.href = '/'
  }

  if (loading) return <p>Loading profile...</p>
  if (error) return <p className="error">{error}</p>
  if (!profile) return <p>No profile data</p>

  return (
    <div className="grid">
      {/* <h2>Profile</h2> */}
      
       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Profile</h2>
        {profile.role === 'tourist' && (
          <Link
            to="/position-simulator"
            className="button"
            style={{ whiteSpace: 'nowrap' }}
          >
            Set location
          </Link>
        )}
      </div>


      <div className="profile-field">
        <strong>Username:</strong>
        <input className="input" value={profile.username} readOnly />
      </div>
      
      <div className="profile-field">
        <strong>Email:</strong>
        <input className="input" value={profile.email} readOnly />
      </div>
      
      <div className="profile-field">
        <strong>Role:</strong>
        <input className="input" value={profile.role} readOnly />
      </div>
      
      <div className="profile-field">
        <strong>First Name:</strong>
        <input className="input" value={profile.first_name || ''} readOnly />
      </div>
      
      <div className="profile-field">
        <strong>Last Name:</strong>
        <input className="input" value={profile.last_name || ''} readOnly />
      </div>
      
      <div className="profile-field">
        <strong>Profile Picture URL:</strong>
        <input className="input" value={profile.profile_picture || ''} readOnly />
        {profile.profile_picture && (
          <img src={profile.profile_picture} alt="Profile" style={{ maxWidth: 100, marginTop: 8, borderRadius: 8 }} />
        )}
      </div>
      
      <div className="profile-field">
        <strong>Biography:</strong>
        <textarea className="input" value={profile.biography || ''} readOnly />
      </div>
      
      <div className="profile-field">
        <strong>Motto:</strong>
        <input className="input" value={profile.motto || ''} readOnly />
      </div>
      
      <button className="button" onClick={handleLogout}>Logout</button>
    </div>
  )
}
