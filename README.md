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
│   └── stakeholders/
│       └── Dockerfile
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

Backend API: http://localhost:8081

MySQL: port 3306 (internal)

### 🛑 Stopping the App

```bash
docker-compose down
```

