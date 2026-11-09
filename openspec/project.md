# Project Context

## Purpose

Horizon is a professional SaaS application for tracking production deployment readiness across multiple projects. It helps teams manage deployment checklists, track task completion, and ensure nothing is missed before launching to production. The application supports multi-user authentication, flexible task management, and provides both project-centric and task-centric views for efficient batch processing.

## Tech Stack

- **Framework**: Next.js 15.5.29 (React 19.1.10) with App Router
- **Database**: MySQL 8.0+ (via mysql2 package)
- **Authentication**: NextAuth.js 5.0 (Google OAuth provider)
- **Styling**: Tailwind CSS 4 with PostCSS
- **Deployment**: Docker-ready with nginx configuration
- **Runtime**: Node.js 22
- **State Management**: React hooks and server-side rendering
- **Unique IDs**: UUID v4 for all entity identifiers

## Project Conventions

### Code Style

- JavaScript (not TypeScript) with ES6+ features
- Client components marked with `"use client"` directive
- Server components by default (Next.js App Router convention)
- Functional components with hooks (no class components)
- Consistent use of async/await for asynchronous operations
- Error handling with try/catch and appropriate user feedback
- JSDoc-style comments in SQL schema files

### Architecture Patterns

- **Server-Client Split**: Server components for data fetching, client components for interactivity
- **API Routes**: RESTful endpoints under `/api/*` using Next.js route handlers
- **Optimistic Updates**: Immediate UI updates followed by API calls with rollback on failure
- **Database Access**: Centralized through `@/lib/db.js` with connection pooling
- **Authentication**: Session-based with NextAuth, all API routes protected
- **Multi-tenancy**: User-scoped data isolation via `user_id` foreign keys
- **Configuration-driven**: Project types and task templates defined in `/src/config/`
- **Component Structure**: Reusable components in `/src/components/`, page-specific logic in page files

### File Organization

```
src/
├── app/              # Next.js pages and API routes
│   ├── api/         # REST API endpoints
│   ├── dashboard/   # Main dashboard page
│   ├── table/       # Table view page
│   └── profile/     # User profile page
├── components/       # Reusable React components
├── config/          # Configuration files (project types, tasks)
└── lib/             # Utilities and database access
    ├── client/      # Client-side utilities
    └── server/      # Server-side utilities
database/             # SQL schema and migrations
scripts/              # Database migration scripts
```

### Testing Strategy

- Manual testing workflow (no automated tests currently)
- Test user tracking features with SQL scripts in root directory
- Migration scripts in `scripts/` directory for schema changes
- Database schema validation via `scripts/check-schema.js`

### Git Workflow

- Main branch for production-ready code
- Feature branches for new development
- Commit messages should be clear and descriptive
- Review documentation files (\*.md) before pushing breaking changes

## Domain Context

### Core Entities

1. **Users**: Authenticated via Google OAuth, identified by UUID
2. **Projects**: Deployment initiatives with metadata (name, client, target date, status)
3. **Tasks**: Individual checklist items within projects (name, category, status, required flag)

### Task Categories

- Infrastructure (env setup, DNS, CDN, database, email)
- Security (SSL, audits)
- Monitoring (analytics, error tracking, performance, uptime)
- DevOps (CI/CD pipelines)
- Testing (load tests, staging, smoke tests)
- Marketing (SEO, meta tags)
- Legal (privacy policy, terms of service)
- Deployment (production deployment steps)

### Project Types

The application supports multiple project type templates:

- Production Deployment (default)
- Website Launch
- Mobile App Release
- API Service Launch
- Database Migration
- Infrastructure Setup
- Security Compliance
- Performance Optimization

### Task Status Values

- Not Started
- In Progress
- Completed
- Blocked

### Project Status Values

- Planning
- In Progress
- Completed
- On Hold

## Important Constraints

### Technical Constraints

- MySQL 5.7+ or MariaDB 10.2+ required
- Environment variables must be configured for database connection and OAuth
- Google OAuth requires valid client ID and secret
- Database tables use InnoDB engine with utf8mb4 character set
- UUIDs stored as VARCHAR(36) for cross-database compatibility
- All datetime fields use MySQL TIMESTAMP or DATETIME types

### Business Constraints

- Each user can only see and modify their own projects (multi-tenant isolation)
- User tracking on tasks shows who last updated (audit trail)
- Projects can be archived but not hard-deleted (soft delete pattern)
- Task completion tracking includes timestamp for analytics

### Performance Considerations

- Database connection pooling enabled
- Optimistic UI updates reduce perceived latency
- Batch project fetches include tasks in single query (JOIN avoided, done in application)
- Client-side state management minimizes re-renders

## External Dependencies

### Required Services

- **Google OAuth 2.0**: User authentication (requires client ID/secret)
- **MySQL Database**: Data persistence (connection via host/port/credentials)

### Optional Services

The application mentions but doesn't directly integrate:

- Analytics services (Google Analytics, Mixpanel)
- Error tracking (Sentry, Rollbar)
- Email services (SendGrid, etc.)
- CDN services
- Monitoring/uptime services

These are checklist items users track, not runtime dependencies.

## Key Features

- Dual view modes: Dashboard (project-centric) and Table (task-centric)
- Flexible project creation: with default tasks or empty
- Custom task creation per project
- Task filtering by category
- Project archiving with restore capability
- Dark mode support
- Real-time progress tracking
- User profile management
- Responsive design for desktop and mobile
