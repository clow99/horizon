# Development Setup Guide

## Prerequisites

- **Node.js 18+**: [Download](https://nodejs.org/)
- **MySQL Server**: [Download Community Edition](https://dev.mysql.com/downloads/mysql/)
- **Git**: [Download](https://git-scm.com/)

## Quick Start (5 minutes)

### 1. Clone Repository

```bash
git clone <repo-url>
cd horizon
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create `.env.local` File

Copy the template below and create a `.env.local` file in the project root:

```env
# Development Environment Variables
NODE_ENV=development

# Database Configuration (MySQL)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=horizon_dev
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-dev-secret-key

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### 4. Database Setup

```bash
# Create the database (if it doesn't exist)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS horizon_dev;"

# Tables are created automatically on first app run
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables Explained

### Required for All Environments

- **NODE_ENV**: Set to `development` for local development, `production` for deployment
- **NEXTAUTH_URL**: The URL where the app is running (http://localhost:3000 for dev)
- **NEXTAUTH_SECRET**: A random secret string (for signing JWTs and cookies)

### Database Configuration

- **MYSQL_HOST**: Hostname of MySQL server (localhost for local dev)
- **MYSQL_PORT**: MySQL port (default: 3306)
- **MYSQL_DATABASE**: Database name to use
- **MYSQL_USER**: MySQL username
- **MYSQL_PASSWORD**: MySQL password

### Google OAuth (Optional)

- **GOOGLE_CLIENT_ID**: From [Google Cloud Console](https://console.cloud.google.com)
- **GOOGLE_CLIENT_SECRET**: From Google Cloud Console
- Leave empty to test without OAuth

---

## Generating NEXTAUTH_SECRET

For development, you can use any string. For production, generate a cryptographically secure one:

```bash
openssl rand -base64 32
```

---

## Troubleshooting

### Error: "MYSQL_HOST is required"

- Check that `.env.local` exists in project root
- Verify MYSQL_HOST and other database variables are set
- Restart the dev server after creating `.env.local`

### Error: "connect ECONNREFUSED 127.0.0.1:3306"

- MySQL server is not running
- Start MySQL and try again

### Error: "Access denied for user 'root'@'localhost'"

- Check MYSQL_PASSWORD in `.env.local` matches your actual MySQL password
- Reset MySQL password if needed: `mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';"`

### App runs but shows blank page

- Check browser console for errors (F12)
- Check server logs in terminal
- Verify NEXTAUTH_URL matches the URL you're accessing

### PKCE errors (production only)

- Verify NEXTAUTH_SECRET is set and consistent
- Verify NEXTAUTH_URL matches your domain exactly
- Check cookies are enabled in browser

---

## Available Commands

```bash
# Start development server with turbopack
npm run dev

# Build for production
npm run build

# Start production server (requires build first)
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests with Playwright
npm run test:e2e

# Run e2e tests with UI
npm run test:e2e:ui

# Run all tests + e2e
npm run test:all

# Lint code
npm run lint

# Database migrations
npm run migrate
npm run migrate:archive
```

---

## Project Structure

```
horizon/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/                # API routes
│   │   ├── dashboard/          # Dashboard page
│   │   ├── table/              # Table view page
│   │   ├── profile/            # User profile page
│   │   └── layout.js           # Root layout
│   ├── components/             # React components
│   │   ├── AuthProvider.js     # Auth context provider
│   │   ├── CreateProjectModal.js
│   │   ├── DashboardClient.js
│   │   └── ...
│   ├── config/                 # Configuration files
│   │   ├── projectTypes.js     # Project templates
│   │   └── tasks.js            # Task templates
│   ├── lib/
│   │   ├── db.js               # Database connection
│   │   ├── server/             # Server utilities
│   │   └── client/             # Client utilities
│   └── auth.js                 # NextAuth configuration
├── database/
│   ├── schema.sql              # MySQL schema
│   └── migration-*.sql         # Migration scripts
├── tests/
│   ├── e2e/                    # End-to-end tests (Playwright)
│   ├── integration/            # Integration tests
│   └── setup/                  # Test utilities
├── .env.local                  # Local environment (git-ignored)
├── jest.config.cjs             # Jest configuration
├── playwright.config.js        # Playwright configuration
└── next.config.mjs             # Next.js configuration
```

---

## Database Schema

The app uses MySQL with these main tables:

- **users**: Stores user information (id, email, name, image)
- **projects**: Stores projects (id, userId, name, type, archived, createdAt, updatedAt)
- **tasks**: Stores tasks (id, projectId, name, description, category, status, required, notes)

Tables are created automatically on first database connection.

---

## Development Tips

1. **Use the Test Database**: Run `npm test` to use SQLite test database (no MySQL needed)
2. **Hot Reload**: Changes to code automatically reload in dev mode
3. **Debug Database Queries**: Add `console.log(sql)` in `src/lib/db.js`
4. **Check Auth Flow**: Monitor cookies in browser DevTools → Storage → Cookies
5. **Mock Auth for Testing**: Set `NEXTAUTH_SECRET` to any value for local testing

---

## Common Development Workflows

### Testing OAuth Locally

1. Set up Google OAuth in [Google Cloud Console](https://console.cloud.google.com)
2. Set authorized redirect URI to: `http://localhost:3000/api/auth/callback/google`
3. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to `.env.local`
4. Restart dev server

### Debugging Database Issues

1. Connect directly: `mysql -u root -p horizon_dev`
2. Check tables: `SHOW TABLES;`
3. Inspect data: `SELECT * FROM projects;`

### Writing Tests

- Unit tests: `tests/setup/` and `src/**/__tests__/`
- Integration tests: `tests/integration/`
- E2E tests: `tests/e2e/`

---

## Getting Help

- Check existing [GitHub Issues](link-to-repo)
- Review test files for usage examples
- Check `/openspec` directory for architecture documentation



