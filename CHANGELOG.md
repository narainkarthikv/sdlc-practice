# Changelog

All notable changes to the Todoist SDLC Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Dark/Light Mode Toggle**: User-selectable theme with system preference detection and localStorage persistence
- **Task Completion Streak Counter**: Visual indicator showing consecutive completed tasks to boost motivation
- **Quick Task Filters**: One-click filtering by status (Todo, In Progress, Done) and priority (High, Low)
- **Unified Service Launcher**: `run-all-services.sh` script to start all services with a single command
- **Modern UI/UX**: Revamped interface with smooth transitions, theme-aware styling, and improved accessibility
- Theme context provider with system preference detection
- Responsive stat cards with improved visual hierarchy
- Enhanced task cards with theme-aware badges

### Changed
- Updated frontend UI to support both light and dark themes
- Improved color contrast for better readability
- Enhanced form inputs with focus states and better visual feedback
- Modernized button styles with theme-aware hover effects
- Updated Tailwind configuration to support `light:` variant

### Fixed
- Theme persistence across page reloads
- Smooth transitions when switching themes

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
- **Unreleased** - UI/UX modernization with theme support
