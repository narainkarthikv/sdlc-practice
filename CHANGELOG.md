# Changelog

All notable changes to the Todoist SDLC Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Planned changes will be recorded here before the next release.

## [1.1.0] - 2026-08-03

This release covers the coordinated frontend, backend, and agents work delivered
between 2026-07-09 and 2026-08-02. The frontend and backend packages are both
versioned `1.1.0`; the agents service is documented as part of the platform
release and does not currently publish an npm package.

### Added

- **Frontend state management**: Redux Toolkit store, authentication state, and
  shared task and summary API types.
- **User accounts and ownership**: signup/login flows, bcrypt password hashing,
  authenticated requests, and per-user task ownership in the backend.
- **Google authentication**: Google identity support and authenticated
  frontend-to-service routing.
- **Private service communication**: service authentication for backend and
  agents calls, with the public frontend acting as the browser-facing proxy.
- **Database migrations**: TypeORM datasource and migrations for the task
  schema and task ownership index.
- **Period-scoped summaries**: day, week, month, and year filters for
  productivity and task summaries based on due dates.

### Changed

- Reworked the dashboard into a responsive, theme-aware SaaS interface with
  light and dark modes, improved accessibility, focus states, and clearer task
  statistics.
- Added system theme detection and persisted the selected theme locally.
- Updated frontend runtime configuration to use same-origin `/api` and
  `/agents` routes while keeping service URLs in the server-side proxy.
- Updated the agents prompts to produce short, practical summaries in plain
  language and to preserve the structured JSON response contracts.
- Normalized summary task filtering at both the frontend and agents service so
  the selected period changes the actual AI input.

### Fixed

- Corrected inclusive period boundaries so a selected window contains exactly
  1, 7, 30, or 365 days.
- Excluded tasks with missing or invalid due dates from period summaries.
- Improved theme persistence and visual consistency across reloads and screen
  sizes.

### Source commits

- `fbe335f` — introduced theme switching and the initial UI modernization.
- `0d6b0a3` — added Redux state management, authentication, and task ownership.
- `2e78fc4` — added Google authentication and service routing.
- `15b4dc6` — refined responsive styling, runtime configuration, and service
  configuration.
- `1244447` — added period filtering and plain-language AI prompts.

## [1.0.0] - 2024-07-08

### Added
- Initial release of Todoist SDLC Platform
- React + TypeScript + Tailwind frontend
- Express.js CRUD API backend with PostgreSQL
- FastAPI agents service with Gemini AI integration
- Task management with CRUD operations
- AI-powered productivity summaries
- AI-powered task summaries
- Docker Compose setup for containerized deployment
- Cloud SQL integration with proxy and connector modes
- Terraform infrastructure as code setup
- Comprehensive environment variable configuration

### Features
- Create, read, update, and delete tasks
- Task status tracking (Todo, In Progress, Done)
- Priority levels (Low, Medium, High)
- Due date management
- Task descriptions and metadata
- Real-time statistics dashboard
- AI-generated productivity insights
- Gemini-powered task analysis
- CORS configuration for cross-origin requests
- Cloud SQL Auth Proxy support
- Database connection pooling

### Infrastructure
- Cloud Run deployment support
- Cloud SQL PostgreSQL database
- Docker containerization for all services
- Terraform modules for GCP resources
- Environment-based configuration management

## Version History

- **1.0.0** - Initial production release (2024-07-08)
- **1.1.0** - Coordinated frontend, backend, and agents feature release (2026-08-03)
