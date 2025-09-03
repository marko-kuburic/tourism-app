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

