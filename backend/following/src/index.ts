import express from 'express'
import fetch from 'node-fetch'
import neo4j from 'neo4j-driver'

const app = express()
app.use(express.json())
// CORS for frontend dev and container
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

const PORT = process.env.PORT || 8083
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://neo4j:7687'
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j'
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'neo4jpassword'
const STAKEHOLDERS_API_URL = process.env.STAKEHOLDERS_API_URL || 'http://backend:8081'

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD))

async function userExists(userId: string): Promise<boolean> {
  const res = await fetch(`${STAKEHOLDERS_API_URL}/users/${userId}`)
  return res.ok
}

async function getUserIdFromRequest(req: express.Request): Promise<string | null> {
  const auth = req.header('Authorization')
  if (!auth) return null
  try {
    const res = await fetch(`${STAKEHOLDERS_API_URL}/me`, {
      method: 'GET',
      headers: { 'Authorization': auth }
    })
    if (!res.ok) return null
    const data: any = await res.json()
    return data.id || data.ID || null
  } catch {
    return null
  }
}

app.post('/follow/:followeeId', async (req, res) => {
  const { followeeId } = req.params
  try {
    const followerId = await getUserIdFromRequest(req)
    if (!followerId) return res.status(401).json({ error: 'Unauthorized' })
    if (followerId === followeeId) return res.status(400).json({ error: 'Cannot follow yourself' })
    const exists = await userExists(followeeId)
    if (!exists) return res.status(400).json({ error: 'User does not exist' })
    const session = driver.session()
    try {
      // Check if already following
      const already = await session.executeRead(tx => tx.run(
        'MATCH (u1:User {id: $followerId})-[:FOLLOWS]->(u2:User {id: $followeeId}) RETURN 1 LIMIT 1',
        { followerId, followeeId }
      ))
      if (already.records.length > 0) {
        return res.status(409).json({ error: 'Already following' })
      }
      // Create relation
      await session.executeWrite(tx => tx.run(
        'MERGE (u1:User {id: $followerId}) MERGE (u2:User {id: $followeeId}) MERGE (u1)-[:FOLLOWS]->(u2)',
        { followerId, followeeId }
      ))
      res.status(201).json({ message: 'Followed' })
    } finally {
      await session.close()
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/follow/:followeeId', async (req, res) => {
  const { followeeId } = req.params
  try {
    const followerId = await getUserIdFromRequest(req)
    if (!followerId) return res.status(401).json({ error: 'Unauthorized' })
    const exists = await userExists(followeeId)
    if (!exists) return res.status(400).json({ error: 'User does not exist' })
    const session = driver.session()
    try {
      // Ensure relation exists
      const rel = await session.executeRead(tx => tx.run(
        'MATCH (u1:User {id: $followerId})-[r:FOLLOWS]->(u2:User {id: $followeeId}) RETURN r LIMIT 1',
        { followerId, followeeId }
      ))
      if (rel.records.length === 0) {
        return res.status(409).json({ error: 'Not following' })
      }
      await session.executeWrite(tx => tx.run(
        'MATCH (u1:User {id: $followerId})-[r:FOLLOWS]->(u2:User {id: $followeeId}) DELETE r',
        { followerId, followeeId }
      ))
      res.json({ message: 'Unfollowed' })
    } finally {
      await session.close()
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// Recommendations: friends-of-friends you don't already follow, then all others by follower count
app.get('/recommendations', async (req, res) => {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    const session = driver.session()
    try {
      // Step 1: Get friends-of-friends (users followed by people you follow)
      const friendsOfFriendsResult = await session.executeRead(tx => tx.run(
        `MATCH (me:User {id: $userId})-[:FOLLOWS]->(:User)-[:FOLLOWS]->(s:User)
         WHERE s.id <> $userId AND NOT (me)-[:FOLLOWS]->(s)
         OPTIONAL MATCH (s)<-[:FOLLOWS]-(f1:User)
         WITH s, count(distinct f1) AS followers
         OPTIONAL MATCH (s)-[:FOLLOWS]->(f2:User)
         WITH s, followers, count(distinct f2) AS following
         RETURN s.id AS id, followers, following
         ORDER BY followers DESC`,
        { userId }
      ))

      // Step 2: Get all users you're NOT following (excluding already found friends-of-friends)
      const followedResult = await session.executeRead(tx => tx.run(
        `MATCH (me:User {id: $userId})-[:FOLLOWS]->(u:User) RETURN u.id AS id`,
        { userId }
      ))
      const alreadyFollowed = new Set<string>(followedResult.records.map(r => r.get('id') as string))
      const friendsOfFriends = new Set<string>(friendsOfFriendsResult.records.map(r => r.get('id') as string))

      // Get all users from stakeholders service
      const usersResponse = await fetch(`${STAKEHOLDERS_API_URL}/users/public`)
      let allOtherUsers: any[] = []
      if (usersResponse.ok) {
        const allUsers: any[] = await usersResponse.json()
        const otherUserIds = allUsers
          .filter(u => u.role !== 'admin') // Exclude admins
          .filter(u => u.id !== userId) // Exclude self
          .filter(u => !alreadyFollowed.has(u.id)) // Exclude already followed
          .filter(u => !friendsOfFriends.has(u.id)) // Exclude friends-of-friends (they go first)
          .map(u => u.id)

        if (otherUserIds.length > 0) {
          const otherUsersResult = await session.executeRead(tx => tx.run(
            `UNWIND $ids AS uid
             OPTIONAL MATCH (u:User {id: uid})
             OPTIONAL MATCH (u)<-[:FOLLOWS]-(f:User)
             WITH uid, count(distinct f) AS followers
             OPTIONAL MATCH (u2:User {id: uid})-[:FOLLOWS]->(x:User)
             RETURN uid AS id, followers, count(distinct x) AS following
             ORDER BY followers DESC`,
            { ids: otherUserIds }
          ))
          allOtherUsers = otherUsersResult.records.map(r => ({
            id: r.get('id') as string,
            followers: Number(r.get('followers')?.toInt ? r.get('followers').toInt() : r.get('followers')),
            following: Number(r.get('following')?.toInt ? r.get('following').toInt() : r.get('following')),
          }))
        }
      }

      // Process and sort each section separately
      const friendsOfFriendsData = friendsOfFriendsResult.records.map(r => ({
        id: r.get('id') as string,
        followers: Number(r.get('followers')?.toInt ? r.get('followers').toInt() : r.get('followers')),
        following: Number(r.get('following')?.toInt ? r.get('following').toInt() : r.get('following')),
        section: 'friends-of-friends' // Section identifier for frontend
      })).sort((a, b) => b.followers - a.followers) // Sort friends-of-friends by followers desc

      const popularUsersData = allOtherUsers.map(u => ({ ...u, section: 'popular' }))
        .sort((a, b) => b.followers - a.followers) // Sort popular users by followers desc

      // Combine: friends-of-friends section first, then popular users section
      const combinedRecommendations = [
        ...friendsOfFriendsData.slice(0, 10), // Limit friends-of-friends to 10
        ...popularUsersData.slice(0, 10)      // Limit popular users to 10
      ]

      // Enrich with user details from stakeholders service
      let enriched: any[] = []
      for (const rec of combinedRecommendations) {
        try {
          const userResponse = await fetch(`${STAKEHOLDERS_API_URL}/users/${rec.id}`)
          if (!userResponse.ok) continue
          const user: any = await userResponse.json()
          if (user.role === 'admin') continue // Double-check admin exclusion
          enriched.push({
            id: rec.id,
            username: user.username,
            role: user.role,
            followers: rec.followers,
            following: rec.following,
            section: rec.section // Include section for frontend categorization
          })
        } catch (error) {
          console.error(`Failed to fetch user details for ${rec.id}:`, error)
        }
      }

      res.json(enriched)
    } finally {
      await session.close()
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/followers/:userId', async (req, res) => {
  const { userId } = req.params
  const session = driver.session()
  try {
    const result = await session.executeRead(tx => tx.run(
      'MATCH (u:User {id: $userId})<-[:FOLLOWS]-(f:User) RETURN f.id AS id',
      { userId }
    ))
    res.json(result.records.map(r => r.get('id')))
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  } finally {
    await session.close()
  }
})

app.get('/following/:userId', async (req, res) => {
  const { userId } = req.params
  const session = driver.session()
  try {
    const result = await session.executeRead(tx => tx.run(
      'MATCH (u:User {id: $userId})-[:FOLLOWS]->(f:User) RETURN f.id AS id',
      { userId }
    ))
    res.json(result.records.map(r => r.get('id')))
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  } finally {
    await session.close()
  }
})

app.listen(PORT, () => {
  console.log(`Following service listening on :${PORT}`)
})


