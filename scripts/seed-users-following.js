#!/usr/bin/env node
/**
 * Seed script: creates users in stakeholders service and makes follow relationships via following service.
 *
 * Requirements:
 * - backend (stakeholders) service reachable at BACKEND_URL (default http://localhost:8081)
 * - following service reachable at FOLLOWING_URL (default http://localhost:8083)
 * - MySQL and Neo4j up (via docker-compose)
 *
 * Config via env vars:
 * - BACKEND_URL: stakeholders base URL (default http://localhost:8081)
 * - FOLLOWING_URL: following base URL (default http://localhost:8083)
 * - TOTAL_USERS: total users to ensure (default 50)
 * - ADMIN_COUNT: how many admins (default 2)
 * - GUIDE_COUNT: how many guides (default 8)
 * - FOLLOWS_MIN: min follows per user (default 3)
 * - FOLLOWS_MAX: max follows per user (default 10)
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8081'
const FOLLOWING_URL = process.env.FOLLOWING_URL || 'http://localhost:8083'
const TOTAL_USERS = Number(process.env.TOTAL_USERS || 50)
const ADMIN_COUNT = Number(process.env.ADMIN_COUNT || 2)
const GUIDE_COUNT = Number(process.env.GUIDE_COUNT || 8)
const TOURIST_COUNT = Math.max(0, TOTAL_USERS - ADMIN_COUNT - GUIDE_COUNT)
const FOLLOWS_MIN = Number(process.env.FOLLOWS_MIN || 3)
const FOLLOWS_MAX = Number(process.env.FOLLOWS_MAX || 10)

if (typeof fetch !== 'function') {
  console.error('This script requires Node 18+ with global fetch available.')
  process.exit(1)
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

async function waitForStakeholders(timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${BACKEND_URL}/users/public`, { method: 'GET' })
      if (r.ok) return
    } catch {}
    await sleep(1000)
  }
  throw new Error(`Stakeholders API not reachable at ${BACKEND_URL}`)
}

function userGen(index, role) {
  const uname = `${role}_${String(index).padStart(2, '0')}`.slice(0, 24)
  const email = `${uname}@example.com`
  const bio = role === 'admin' ? 'Administrator account for moderation.'
    : role === 'guide' ? 'Licensed tour guide ready to explore!'
    : 'Adventure-loving tourist.'
  return {
    username: uname,
    password: 'Password123!',
    email,
    role,
    profile_picture: '',
    biography: bio,
    motto: 'Travel more, worry less.'
  }
}

async function registerUser(u) {
  const res = await fetch(`${BACKEND_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(u)
  })
  if (res.ok) {
    const data = await res.json()
    return { created: true, user: data }
  }
  // On conflicts or other errors, we attempt login path to fetch existing user id
  return { created: false, error: await safeText(res) }
}

async function loginUser(email, password) {
  const res = await fetch(`${BACKEND_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) throw new Error(`Login failed for ${email}: ${await safeText(res)}`)
  const data = await res.json()
  return { user: data.user, token: data.token }
}

async function follow(followerToken, followeeId) {
  const res = await fetch(`${FOLLOWING_URL}/follow/${followeeId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${followerToken}` }
  })
  if (res.status === 201) return { ok: true }
  const txt = await safeText(res)
  if (res.status === 409) return { ok: false, reason: 'already-following' }
  return { ok: false, reason: txt || res.statusText }
}

async function safeText(res) {
  try { return await res.text() } catch { return '' }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

async function main() {
  console.log(`Seeding ${TOTAL_USERS} users (admins: ${ADMIN_COUNT}, guides: ${GUIDE_COUNT}, tourists: ${TOURIST_COUNT})`)
  console.log(`BACKEND_URL=${BACKEND_URL} FOLLOWING_URL=${FOLLOWING_URL}`)
  await waitForStakeholders().catch(err => { throw err })

  // Build desired users list
  const desired = []
  for (let i = 1; i <= ADMIN_COUNT; i++) desired.push(userGen(i, 'admin'))
  for (let i = 1; i <= GUIDE_COUNT; i++) desired.push(userGen(i, 'guide'))
  for (let i = 1; i <= TOURIST_COUNT; i++) desired.push(userGen(i, 'tourist'))

  const ensured = [] // { id, username, email, role, token }
  for (const u of desired) {
    try {
      const reg = await registerUser(u)
      if (reg.created) {
        console.log(`Created user ${u.username} (${u.role})`)
      } else {
        if (reg.error && reg.error.includes('already')) {
          console.log(`User exists ${u.username}, will login`)
        } else {
          console.warn(`Register issue for ${u.username}: ${reg.error}`)
        }
      }
      const { user, token } = await loginUser(u.email, u.password)
      ensured.push({ id: user.id || user.ID, username: u.username, email: u.email, role: u.role, token })
      // tiny delay to avoid bursts
      await sleep(50)
    } catch (e) {
      console.error(`Failed to ensure user ${u.username}:`, e.message)
    }
  }

  // Summary users
  const byRole = ensured.reduce((acc, u) => { acc[u.role] = (acc[u.role]||0)+1; return acc }, {})
  console.log('Users ensured:', ensured.length, byRole)

  // Create follow graph
  let createdFollows = 0
  let skipped = 0
  const ids = ensured.map(u => u.id)
  for (const u of ensured) {
    const desiredCount = Math.floor(Math.random() * (FOLLOWS_MAX - FOLLOWS_MIN + 1)) + FOLLOWS_MIN
    const candidates = shuffle(ids.filter(id => id !== u.id)).slice(0, desiredCount)
    for (const followeeId of candidates) {
      try {
        const r = await follow(u.token, followeeId)
        if (r.ok) {
          createdFollows++
        } else if (r.reason === 'already-following') {
          skipped++
        } else {
          // Other error cases (e.g., transient) — log and continue
          console.warn(`Follow failed ${u.username} -> ${followeeId}: ${r.reason}`)
        }
        await sleep(10)
      } catch (e) {
        console.warn(`Follow error ${u.username} -> ${followeeId}: ${e.message}`)
      }
    }
  }

  console.log(`Follow relations created: ${createdFollows}, skipped: ${skipped}`)
  console.log('Seeding complete.')
}

main().catch((e) => {
  console.error('Seeding failed:', e)
  process.exit(1)
})
