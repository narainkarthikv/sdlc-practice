# Todoist SDLC Platform

A modern, full-stack task management platform with AI-powered productivity insights. Built with React, Express, FastAPI, and powered by Google's Gemini AI.

![Tech Stack](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react)
![Express](https://img.shields.io/badge/Express-5.1.0-000000?logo=express)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.8-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Cloud%20SQL-4169E1?logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?logo=typescript)

## 🌟 Features

- ✅ **Task Management**: Full CRUD operations for tasks with status, priority, and due dates
- 🎨 **Dark/Light Mode**: System-aware theme with manual toggle and localStorage persistence
- 🔥 **Completion Streak**: Visual motivation tracker showing consecutive completed tasks
- 🎯 **Quick Filters**: One-click filtering by status and priority
- 🤖 **AI Summaries**: Gemini-powered productivity insights and task analysis
- 📊 **Real-time Stats**: Dashboard with task metrics and analytics
- 🎭 **Modern UI**: Smooth transitions, responsive design, and accessibility-first
- 🐳 **Docker Ready**: Full containerization with Docker Compose
- ☁️ **Cloud Native**: Designed for Google Cloud Run and Cloud SQL

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Development](#-development)
- [Docker Deployment](#-docker-deployment)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

## 🛠 Tech Stack

### Frontend
- **React 19.1.0** - UI library with latest features
- **TypeScript 5.9.2** - Type-safe JavaScript
- **Vite 7.1.2** - Lightning-fast build tool
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **React Hooks** - Modern state management

### Backend
- **Express 5.1.0** - Web application framework
- **PostgreSQL** - Cloud SQL database
- **Node.js** - JavaScript runtime
- **Zod 3.25.76** - TypeScript-first schema validation
- **@google-cloud/cloud-sql-connector** - Cloud SQL connection management

### AI Agents
- **FastAPI 0.115.8** - High-performance Python framework
- **Google Gemini AI** - AI-powered insights and summaries
- **Uvicorn** - ASGI server
- **Pydantic 2.10.6** - Data validation

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Google Cloud Run** - Serverless deployment
- **Google Cloud SQL** - Managed PostgreSQL
- **Terraform** - Infrastructure as code
- **Cloud SQL Auth Proxy** - Secure database connections

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.11 or higher) - [Download](https://python.org/)
- **npm** (comes with Node.js)
- **cloud-sql-proxy** - [Installation Guide](https://cloud.google.com/sql/docs/mysql/sql-proxy)
- **Google Cloud SDK** (gcloud) - [Installation Guide](https://cloud.google.com/sdk/docs/install)
- **Docker** (optional, for containerized deployment) - [Download](https://docker.com/)

## 🚀 Quick Start

The fastest way to run all services locally:

```bash
# 1. Clone the repository
git clone https://github.com/narainkarthikv/sdlc-practice.git
cd sdlc-practice

# 2. Set up environment variables (see Configuration section)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp agents/.env.example agents/.env

# 3. Configure your Cloud SQL connection and Gemini API key
# Edit backend/.env, frontend/.env, and agents/.env

# 4. Run all services with one command
./run-all-services.sh
```

**That's it!** 🎉 The script will:
- Start Cloud SQL Proxy with IAM authentication
- Launch the Agents service on `http://localhost:8000`
- Start the Backend API (check logs for port)
- Run the Frontend dev server (check logs for port)
- Auto-install dependencies if needed
- Gracefully stop all services with `Ctrl+C`

## 📥 Installation

### Manual Setup (Step-by-Step)

#### 1. Clone the Repository

```bash
git clone https://github.com/narainkarthikv/sdlc-practice.git
cd sdlc-practice
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations (if needed)
# npm run migrate

# Start the server
npm run dev
```

The backend will start on the configured PORT (default: 8080).

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your backend/agents URLs

# Start development server
npm run dev
```

The frontend will start on the default Vite port (usually 5173).

#### 4. Agents Setup

```bash
cd agents

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Add your GEMINI_API_KEY

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The agents service will start on port 8000.

#### 5. Start Cloud SQL Proxy

```bash
# Authenticate with Google Cloud
gcloud auth application-default login

# Start the proxy with IAM authentication
cloud-sql-proxy <INSTANCE_CONNECTION_NAME> --auth-iam-authn
```

Replace `<INSTANCE_CONNECTION_NAME>` with your Cloud SQL instance name (format: `project:region:instance`).

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Server Configuration
PORT=8080

# Database Configuration
DB_CONNECTION_MODE=proxy  # or 'connector' for Cloud Run

# For proxy mode (local development)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_SOCKET_DIR=/cloudsql

# For connector mode (Cloud Run)
INSTANCE_CONNECTION_NAME=project:region:instance
DB_NAME=todoist
DB_USER=service-account@project.iam
DB_PASSWORD=  # Leave empty for IAM auth

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:8081
```

### Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_AGENT_BASE_URL=http://localhost:8000
```

### Agents Environment Variables

Create `agents/.env`:

```env
PORT=8000
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-1.5-flash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8081
```

## 💻 Development

### Frontend Development

```bash
cd frontend

# Run dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit
```

### Backend Development

```bash
cd backend

# Run with auto-reload
npm run dev

# Run without reload
npm start

# Syntax check
npm run check
```

### Agents Development

```bash
cd agents

# Activate virtual environment
source venv/bin/activate

# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests (if available)
# pytest
```

### Using the Unified Script

The `run-all-services.sh` script is the recommended way to run all services during development:

```bash
# Start all services
./run-all-services.sh

# The script will:
# ✓ Check for required tools (node, python3, cloud-sql-proxy)
# ✓ Create Python virtual environment if needed
# ✓ Install dependencies automatically
# ✓ Start all services in parallel
# ✓ Show colored status logs
# ✓ Stop all services gracefully with Ctrl+C
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and start all services
docker compose up --build

# Run in detached mode
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

Services will be available at:
- **Frontend**: http://localhost:8081
- **Backend**: http://localhost:8080
- **Agents**: http://localhost:9000

### Prerequisites for Docker

1. Authenticate with Google Cloud:
```bash
gcloud auth application-default login
```

2. Set environment variables:
```bash
export INSTANCE_CONNECTION_NAME=project:region:instance
export DB_NAME=todoist
export DB_USER=service-account@project.iam
export DB_PASSWORD=  # Optional for IAM auth
export GEMINI_API_KEY=your-api-key
```

3. The compose stack includes the Cloud SQL Auth Proxy container automatically.

## 📚 API Documentation

### Backend API Endpoints

#### Tasks

- `GET /tasks` - List all tasks
- `GET /tasks/:id` - Get a single task
- `POST /tasks` - Create a new task
- `PUT /tasks/:id` - Update a task
- `DELETE /tasks/:id` - Delete a task

**Example Request**:
```bash
curl -X POST http://localhost:8080/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project",
    "description": "Finish the SDLC project",
    "status": "todo",
    "priority": "high",
    "dueDate": "2024-12-31"
  }'
```

### Agents API Endpoints

#### AI Summaries

- `POST /agents/productivity-summary` - Generate productivity summary
  - Body: `{ period: "day" | "week" | "month" | "year", tasks: Task[] }`

- `POST /agents/task-summary` - Generate task summary
  - Body: `{ tasks: Task[] }`

**Example Request**:
```bash
curl -X POST http://localhost:8000/agents/task-summary \
  -H "Content-Type: application/json" \
  -d '{"tasks": [...]}'
```

## 📁 Project Structure

```
sdlc-practice/
├── agents/                 # FastAPI AI service
│   ├── app/
│   │   ├── main.py        # FastAPI application
│   │   └── __init__.py
│   ├── requirements.txt   # Python dependencies
│   ├── Dockerfile
│   └── .env.example
├── backend/               # Express API service
│   ├── src/
│   │   └── server.js     # Express server
│   ├── schema.sql        # Database schema
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/             # React application
│   ├── src/
│   │   ├── App.tsx       # Main app component
│   │   ├── main.tsx      # Entry point
│   │   ├── index.css     # Global styles
│   │   ├── lib/
│   │   │   ├── api.ts    # API client
│   │   │   └── themeContext.tsx  # Theme provider
│   │   └── types.ts      # TypeScript types
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.cjs
│   ├── Dockerfile
│   └── .env.example
├── terraform/            # Infrastructure as code
│   └── ...
├── docker-compose.yml    # Multi-service orchestration
├── run-all-services.sh   # Unified service launcher
├── CHANGELOG.md          # Version history
├── README.md             # This file
└── .gitignore
```

## 🎨 Features Deep Dive

### Dark/Light Mode
- **System Detection**: Automatically detects your OS theme preference
- **Manual Toggle**: Switch themes with the sun/moon button
- **Persistence**: Theme choice saved to localStorage
- **Smooth Transitions**: All elements transition smoothly between themes

### Task Completion Streak
- Tracks consecutive completed tasks
- Updates in real-time
- Motivational visual indicator with 🔥 emoji
- Resets when non-completed task is encountered

### Quick Filters
- Filter by status: All, Todo, In Progress, Done
- Filter by priority: High, Low
- Instant UI updates with smooth transitions
- Active filter highlighted
- Shows filtered count

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is part of an SDLC practice exercise.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for AI-powered summaries
- [React](https://react.dev/) for the UI framework
- [FastAPI](https://fastapi.tiangolo.com/) for the Python API framework
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities
- [Google Cloud](https://cloud.google.com/) for infrastructure

## 📞 Support

For issues and questions:
- Check the [CHANGELOG](CHANGELOG.md) for recent updates
- Review the configuration in `.env.example` files
- Ensure all prerequisites are installed
- Verify Cloud SQL proxy is running
- Check that all environment variables are set correctly

## 🔗 Links

- [GitHub Repository](https://github.com/narainkarthikv/sdlc-practice)
- [Google Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)

---

Made with ❤️ for learning and practicing SDLC workflows
