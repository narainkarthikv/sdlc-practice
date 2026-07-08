# Todoist SDLC Platform

Monorepo for a task management prototype:

- `frontend`: React + TypeScript + Tailwind
- `backend`: Express CRUD API backed by the existing database
- `agents`: FastAPI service using Gemini API for productivity and task summaries

## Environment

Frontend:

- `VITE_API_BASE_URL`
- `VITE_AGENT_BASE_URL`

Backend:

- `PORT`
- `DB_CONNECTION_MODE=proxy|connector`
- `DATABASE_URL` or `INSTANCE_CONNECTION_NAME` with `DB_NAME` and `DB_USER`
- `DB_PASSWORD` if your Cloud SQL user requires password auth
- `DB_SOCKET_DIR`
- `DB_HOST` and `DB_PORT` for a local Cloud SQL proxy
- `CORS_ORIGINS`

Use `DB_CONNECTION_MODE=proxy` for local development with the Cloud SQL Auth Proxy. Use `DB_CONNECTION_MODE=connector` in Cloud Run so the app connects through `@google-cloud/cloud-sql-connector` without the proxy container.

Agents:

- `PORT`
- `GEMINI_API_KEY` for live Gemini summaries; optional for container startup
- `GEMINI_MODEL`
- `ALLOWED_ORIGINS`

## Run

Install dependencies per service and start them independently.

## Docker Compose

Use `docker compose up --build` to start the app stack.

- Frontend: `http://localhost:8081`
- Backend: `http://localhost:8080`
- Agents: `http://localhost:9000`

The compose stack also starts the Cloud SQL Auth Proxy container by default.
That proxy uses ADC from your local gcloud config, so run `gcloud auth application-default login` first.
Compose reads `frontend/.env`, `backend/.env`, and `agents/.env` for service-specific runtime variables.

Set `INSTANCE_CONNECTION_NAME`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `GEMINI_API_KEY` in your shell or a local `.env` file before starting the stack.
If `INSTANCE_CONNECTION_NAME` is missing, the proxy container will fail at runtime with a clear error instead of failing during compose parsing.
