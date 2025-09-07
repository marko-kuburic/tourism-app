import { useEffect, useMemo, useState } from 'react'
import { getProfile, getAllUsers, blockUser } from './api.js'
import { useNavigate } from 'react-router-dom'

function toBool(v) {
  if (typeof v === 'boolean') return v
  if (v === 1 || v === '1' || v === 'true' || v === 'TRUE') return true
  if (v === 0 || v === '0' || v === 'false' || v === 'FALSE') return false
  return Boolean(v)
}

function normalizeUser(u) {
  const activatedRaw =
    u.activated ?? u.Activated ?? u.isActive ?? u.is_active ?? u.enabled
  const activated = toBool(activatedRaw)
  return {
    ...u,
    _activated: activated,
    _isBlocked: !activated,
  }
}

function normalizeUsers(list) {
  return Array.isArray(list) ? list.map(normalizeUser) : []
}

export default function AdminUsers() {
  const [me, setMe] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionMsg, setActionMsg] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const profile = await getProfile()
        if (!mounted) return
        setMe(profile)

        const role = String(profile?.role ?? profile?.Role ?? '').toLowerCase()
        if (role !== 'admin') {
          setError('Only admin can access this page')
          setTimeout(() => navigate('/profile'), 1200)
          return
        }

        const all = await getAllUsers()
        if (!mounted) return
        setUsers(normalizeUsers(all))
      } catch (e) {
        setError(e.message || 'Failed to load data')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [navigate])

  const myId = useMemo(() => me?.id, [me])

  async function refresh() {
    const all = await getAllUsers()
    setUsers(normalizeUsers(all))
  }

  async function onBlock(u) {
    if (!window.confirm(`Block "${u.username}"?`)) return

    const prev = users
    setUsers(list =>
      list.map(x =>
        x.id === u.id
          ? { ...x, activated: false, Activated: 0, _activated: false, _isBlocked: true }
          : x
      )
    )

    try {
      await blockUser(u.id)
      setActionMsg(`User "${u.username}" blocked`)
      await refresh()
    } catch (e) {
      const msg = (e?.message || '').toLowerCase()
      if (msg.includes('already blocked')) {
        setActionMsg('User is already blocked')
        await refresh()
      } else {
        setActionMsg(e.message || 'Blocking failed')
        setUsers(prev) 
      }
    }
  }

  if (loading) return <p>Loading users…</p>
  if (error) return <p className="error">{error}</p>

  return (
    <div className="grid" style={{ gap: 12 }}>
      <h3>All users</h3>
      {actionMsg && <p className="success">{actionMsg}</p>}

      <div className="table-wrap">
        <table className="table table-wide">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Activated</th>
              <th>Created</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isSelf = myId && (u.id === myId)
              const isBlocked = !!u._isBlocked
              const canBlock = !isSelf && !isBlocked
              const created = u.createdAt ?? u.created_at ?? u.created

              return (
                <tr key={u.id} className={isBlocked ? 'row-blocked' : ''}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.role ?? u.Role ?? '—'}</td>
                  <td>
                    {isBlocked
                      ? <span className="badge badge-danger">Blocked</span>
                      : <span className="badge badge-ok">Yes</span>}
                  </td>
                  <td>{created ? new Date(created).toLocaleString() : '—'}</td>
                  <td>
                    {isBlocked ? (
                      <button
                        className="button button-danger"
                        disabled
                        style={{ cursor:'not-allowed', opacity:.9 }}
                      >
                        Blocked
                      </button>
                    ) : (
                      <button
                        className="button"
                        disabled={!canBlock}
                        title={isSelf ? "Can't block yourself" : 'Block user'}
                        onClick={() => onBlock(u)}
                      >
                        Block
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
