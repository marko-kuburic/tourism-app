# tourism-app

### ✅ Prerequisites

Before you begin, make sure you have:

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/) installed (Docker Desktop includes this)

---

### 📦 Project Structure
```
tourism-app/
├── backend/
│   ├── stakeholders/          # User management service
│   │   └── Dockerfile
│   └── blog/                  # Blog service
│       └── Dockerfile
├── frontend/                  # Auth UI (React + Vite)
│   ├── src/modules/auth/      # Login/Register/Profile pages
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

### 🔧 Setup

1. **Clone the repository**

```bash
git clone git@github.com:marko-kuburic/tourism-app.git
git checkout develop
cd tourism-app
```

2. **Start the project**

```bash
docker-compose up --build
```
### 🌐 Access the App

**Frontend (Auth UI):** http://localhost:3000
- Login/Register pages
- User profile management
- Isolated React app for authentication

**Backend APIs:**
- Stakeholders (User management): http://localhost:8081
- Blog service: http://localhost:8082

**Databases:**
- MySQL: port 3306 (internal)
- MongoDB: port 27017 (internal)

### 🛑 Stopping the App

```bash
docker-compose down
```

### 🚀 Development

**Frontend Development (Optional):**
```bash
cd frontend
npm install
npm run dev
```
- Runs on http://localhost:5173
- Hot reload enabled
- Uses Vite proxy to backend

**Backend Development:**
- Stakeholders service: Go + MySQL
- Blog service: Go + MongoDB
- Both services include JWT authentication


### Seed demo data (users + followings)

We provide a small Node.js script to populate the stakeholders (users) and following (graph) services:

- Creates TOTAL_USERS (default 50) across roles: admins, guides, tourists
- Logs them in to obtain tokens
- Creates randomized follow relationships among them in Neo4j via the following service

Prereqs:
- Backend services up (stakeholders on 8081, following on 8083)
- Node 18+ on your host (or run via docker container, see optional below)

Run locally:

```
BACKEND_URL=http://localhost:8081 \
FOLLOWING_URL=http://localhost:8083 \
TOTAL_USERS=50 ADMIN_COUNT=2 GUIDE_COUNT=8 \
node scripts/seed-users-following.js
```

Environment variables:
- BACKEND_URL (default http://localhost:8081)
- FOLLOWING_URL (default http://localhost:8083)
- TOTAL_USERS (default 50)
- ADMIN_COUNT (default 2)
- GUIDE_COUNT (default 8)
- FOLLOWS_MIN (default 3)
- FOLLOWS_MAX (default 10)

Optional: run inside a container on the same Docker network. Example using the default published ports:

```
docker run --rm -it \
	-v "$PWD":/work -w /work \
	--network host \
	node:20 \
	bash -lc "node -v && BACKEND_URL=http://localhost:8081 FOLLOWING_URL=http://localhost:8083 node scripts/seed-users-following.js"
```

