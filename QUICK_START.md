# Quick Start Guide

## 🚀 Development Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

Create a `.env.local` file in the project root (this file is git-ignored for security):

```env
# Development Environment Variables
NODE_ENV=development

# Database Configuration (MySQL)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=horizon_dev
MYSQL_USER=root
MYSQL_PASSWORD=your_password

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key-change-this-in-production

# Google OAuth (Optional - leave empty for local testing)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**Required Setup:**

- Make sure MySQL is running locally
- Create a database named `horizon_dev` (or update MYSQL_DATABASE)
- Run migrations if this is your first time (the app creates tables automatically on first connection)

### Step 3: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Quick Create Projects

### Option 1: Quick Create with Presets

```
1. Click "New Project"
2. Select a project type (e.g., 🌐 Website Launch)
3. Click "Create Project"
✅ Done! Project created with 10 preset tasks
```

### Option 2: Customized Create

```
1. Click "New Project"
2. Select a project type
3. Review preset tasks
4. Click "Add Task" to add custom ones
5. Click edit ✏️ to modify tasks
6. Click delete 🗑️ to remove tasks
7. Click "Create Project"
✅ Done! Project created with your customized tasks
```

## 📋 Available Project Types

| Icon | Type                  | Tasks | Best For               |
| ---- | --------------------- | ----- | ---------------------- |
| 🚀   | Production Deployment | 12    | Web apps to production |
| 🌐   | Website Launch        | 10    | Marketing sites        |
| ⚡   | API Service           | 10    | REST/GraphQL APIs      |
| 📱   | Mobile App            | 10    | iOS/Android apps       |
| 💼   | SaaS Product          | 12    | SaaS applications      |
| ✨   | Custom Project        | 0     | Start from scratch     |

## 💡 Pro Tips

- **Start with closest match** - Pick the type most similar to your project
- **Customize freely** - Add/remove tasks as needed
- **Use descriptions** - Add context to tasks for better clarity
- **Mark critical as required** - Use the required flag wisely
- **Don't overthink it** - You can edit tasks after creation too

## 📚 Need More Help?

- **Quick Overview:** `FEATURE_SUMMARY.md`
- **Full Guide:** `MIGRATION_GUIDE.md`
- **Tech Docs:** `PROJECT_CREATION_ENHANCEMENT.md`
- **All Changes:** `CHANGES_SUMMARY.md`

## ✅ Quick Test

Try this right now:

1. Go to dashboard
2. Click "New Project"
3. Select "🌐 Website Launch"
4. Review the 10 preset tasks
5. Click "Add Task" and add: "Setup Google Search Console"
6. Click "Create Project"

You should see a new project with 11 tasks (10 preset + 1 custom)!

## Production Deployment (Docker)

### Prerequisites

- Docker and Docker Compose installed
- Google OAuth credentials (Client ID and Secret)
- A domain name (for NEXTAUTH_URL)
- A database connection string (MySQL)

### Setup Steps

1. **Generate NEXTAUTH_SECRET**

   ```bash
   openssl rand -base64 32
   # Output example: abc123xyz...
   ```

2. **Create environment file** (or export variables)

   ```bash
   export NODE_ENV=production
   export NEXTAUTH_URL=https://yourdomain.com
   export NEXTAUTH_SECRET=<generated-secret>
   export GOOGLE_CLIENT_ID=<from-google-console>
   export GOOGLE_CLIENT_SECRET=<from-google-console>
   export DATABASE_URL=mysql://user:password@host:3306/dbname
   ```

3. **Build and start the container**

   ```bash
   docker-compose up -d
   ```

4. **View logs**

   ```bash
   docker-compose logs -f
   ```

5. **Access the app**
   - URL: https://yourdomain.com (or http://localhost:8067 for local testing)
   - The app will be available on the configured domain

### Important Notes

- **NEXTAUTH_URL must match your domain exactly** (including protocol: https://)
- **Cookies are automatically set with secure=true in production**
- **OAuth flow requires PKCE, which is now properly configured**
- If you get `InvalidCheck: pkceCodeVerifier` errors, verify the NEXTAUTH_URL

---

**Status:** ✅ Ready to use  
**Version:** 1.0.0  
**Time to learn:** 2 minutes  
**Time to create project:** 30 seconds
