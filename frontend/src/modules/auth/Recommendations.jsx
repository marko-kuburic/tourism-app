import { useEffect, useState } from 'react'
import { getRecommendations, followUser } from './api.js'
import '../../styles/auth.css'

export default function Recommendations() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await getRecommendations()
        setItems(res)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function onFollow(id) {
    try {
      await followUser(id)
      setItems(prev => prev.filter(x => x.id !== id))
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-500 text-center mt-4">{error}</p>
  if (!items.length) return <p className="text-center mt-4">No recommendations right now.</p>

  return (
    <div className="auth-wrap">
      <div className="card" style={{backgroundColor: '#0f172a'}}>
        <h2 className="title text-center mb-4" style={{textAlign: 'center', marginBottom: '36px'}}>People you may follow</h2>
        <div className="grid">
          {items.map(x => (
            <div key={x.id} className="card" style={{padding: '16px 12px', margin: '0 auto 16px auto', maxWidth: 352, backgroundColor: '#0f172a'}}>
              <div style={{display: 'flex', alignItems: 'center', marginBottom: 8}}>
                <div style={{width: '120px', textAlign: 'center', flexShrink: 0, marginRight: '16px'}}>
                  <span className="text-lg font-semibold">{x.username || x.id}</span>
                </div>
                <div style={{flex: '1', textAlign: 'center'}} className="profile-field">
                  <strong>Followers</strong>
                  <span style={{fontWeight: 'bold'}}>{x.followers ?? 0}</span>
                </div>
                <div style={{flex: '1', textAlign: 'center'}} className="profile-field">
                  <strong>Following</strong>
                  <span style={{fontWeight: 'bold'}}>{x.following ?? 0}</span>
                </div>
              </div>
              <button className="button" style={{width: '100%', marginTop: 8}} onClick={() => onFollow(x.id)}>
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


