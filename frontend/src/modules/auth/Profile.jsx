import { useEffect, useState } from 'react'
import { getProfile, updateProfile, uploadProfilePicture } from './api.js'
import { Link } from 'react-router-dom'  

const apiBaseUrl = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8080'

function getImageUrl(imagePath) {
  if (!imagePath) return null
  if (imagePath.startsWith('http')) return imagePath // Already a full URL
  if (imagePath.startsWith('/uploads/')) return `${apiBaseUrl}${imagePath}` // Direct backend serving
  return imagePath // Fallback
}  

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getProfile()
        setProfile(data)
        setEditForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          profile_picture: data.profile_picture || '',
          biography: data.biography || '',
          motto: data.motto || ''
        })
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

  function handleEdit() {
    setIsEditing(true)
    setError(null)
  }

  function handleCancel() {
    setIsEditing(false)
    setSelectedFile(null)
    setEditForm({
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      profile_picture: profile.profile_picture || '',
      biography: profile.biography || '',
      motto: profile.motto || ''
    })
  }

  function handleFileChange(file) {
    setSelectedFile(file)
    if (file) {
      // Create a preview URL for the selected file
      const previewUrl = URL.createObjectURL(file)
      setEditForm(prev => ({ ...prev, profile_picture: previewUrl }))
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      let profileData = { ...editForm }
      
      // If a file was selected, upload it first
      if (selectedFile) {
        const uploadResponse = await uploadProfilePicture(selectedFile)
        profileData.profile_picture = uploadResponse.file_path
      }
      
      const updatedProfile = await updateProfile(profileData)
      setProfile(updatedProfile)
      setIsEditing(false)
      setSelectedFile(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function handleInputChange(field, value) {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  if (loading) return <p>Loading profile...</p>
  if (error && !profile) return <p className="error">{error}</p>
  if (!profile) return <p>No profile data</p>

  return (
    <div className="grid">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Profile</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {profile.role === 'tourist' && (
            <Link
              to="/position-simulator"
              className="button"
              style={{ whiteSpace: 'nowrap' }}
            >
              Set location
            </Link>
          )}
          {isEditing && (
            <>
              <button 
                className="button" 
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: '#007bff' }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="button" 
                onClick={handleCancel}
                disabled={saving}
                style={{ backgroundColor: '#6c757d' }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div style={{ color: 'red', padding: '8px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}

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
        <input 
          className="input" 
          value={isEditing ? editForm.first_name : (profile.first_name || '')} 
          readOnly={!isEditing}
          onChange={isEditing ? (e) => handleInputChange('first_name', e.target.value) : () => {}}
          placeholder={isEditing ? "Enter your first name" : ""}
        />
      </div>
      
      <div className="profile-field">
        <strong>Last Name:</strong>
        <input 
          className="input" 
          value={isEditing ? editForm.last_name : (profile.last_name || '')} 
          readOnly={!isEditing}
          onChange={isEditing ? (e) => handleInputChange('last_name', e.target.value) : () => {}}
          placeholder={isEditing ? "Enter your last name" : ""}
        />
      </div>
      
      <div className="profile-field">
        <strong>Profile Picture:</strong>
        {isEditing ? (
          <div>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files[0])}
              className="input"
              style={{ marginBottom: '12px' }}
            />
            {editForm.profile_picture && (
              <div>
                <img 
                  src={editForm.profile_picture.startsWith('blob:') ? editForm.profile_picture : getImageUrl(editForm.profile_picture)} 
                  alt="Profile Preview" 
                  style={{ maxWidth: 200, maxHeight: 200, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
          </div>
        ) : (
          <div>
            {profile.profile_picture ? (
              <div style={{ marginTop: '8px' }}>
                <img 
                  src={getImageUrl(profile.profile_picture)} 
                  alt="Profile" 
                  style={{ maxWidth: 200, maxHeight: 200, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            ) : (
              <div style={{ 
                padding: '40px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: 12, 
                color: '#666',
                fontStyle: 'italic'
              }}>
                No profile picture
              </div>
            )}
          </div>
        )}
      </div>
      
            <div className="profile-field">
        <strong>Biography:</strong>
        <textarea 
          className="input" 
          value={isEditing ? editForm.biography : (profile.biography || '')} 
          readOnly={!isEditing}
          onChange={isEditing ? (e) => handleInputChange('biography', e.target.value) : () => {}}
          style={{ 
            minHeight: '80px',
            resize: isEditing ? 'vertical' : 'none'
          }}
          placeholder={isEditing ? "Tell us about yourself..." : ""}
        />
      </div>
      
      <div className="profile-field">
        <strong>Motto:</strong>
        <input 
          className="input" 
          value={isEditing ? editForm.motto : (profile.motto || '')} 
          readOnly={!isEditing}
          onChange={isEditing ? (e) => handleInputChange('motto', e.target.value) : () => {}}
          placeholder={isEditing ? "Your life motto..." : ""}
          maxLength={255}
        />
      </div>

      {!isEditing && (
        <div style={{ marginTop: '24px' }}>
          <button className="button" onClick={handleEdit}>
            Edit Profile
          </button>
        </div>
      )}
    </div>
  )
}
