# Horizon

A professional SaaS-style application for tracking production deployment readiness across multiple projects. Built with Next.js, React, Tailwind CSS, and MySQL.

## 🎉 MySQL Database Integration

The application now uses **MySQL** for persistent server-side storage instead of localStorage:

- ✅ Data persists across devices and browsers
- ✅ No browser storage limitations
- ✅ Centralized data management
- ✅ Automatic table creation
- ✅ RESTful API endpoints

See [MYSQL_MIGRATION.md](./MYSQL_MIGRATION.md) for detailed migration documentation.

## Features

### 🎯 Flexible Task Management

- **Optional Default Checklist**: Choose to start with 18 pre-configured production tasks or start from scratch
- **Fully Customizable**: Add, edit, or delete any tasks on a per-project basis
- **Custom Task Creation**: Add your own tasks with custom categories, descriptions, and requirements
- **Per-Project Flexibility**: Each project can have its own unique set of tasks

### 📊 Production-Ready Default Categories

- **Infrastructure**: Environment setup, DNS, database backups, CDN
- **Security**: SSL certificates, security audits
- **Monitoring**: Analytics, error tracking, performance monitoring, uptime alerts
- **DevOps**: CI/CD pipeline configuration
- **Testing**: Load testing, staging tests, smoke tests
- **Marketing**: SEO optimization, meta tags
- **Legal**: Privacy policy, terms of service
- **Deployment**: Production deployment steps

### ✨ Advanced Task Features

- **Add Custom Tasks**: Create project-specific tasks with full details
- **Delete Tasks**: Remove any task that doesn't apply to your project
- **Required vs Optional**: Mark tasks as required for deployment readiness
- **Status Tracking**: Track each task status (Not Started, In Progress, Completed, Blocked)
- **Notes System**: Add detailed notes, assignee info, or links to any task
- **Category Filtering**: Filter tasks by category for focused workflow

## Production Checklist Items

1. **Environment Setup** - Configure production environment variables and secrets
2. **Domain & DNS Configuration** - Setup custom domain and configure DNS records
3. **SSL Certificate** - Install and configure SSL/TLS certificate
4. **Analytics Integration** - Connect Google Analytics, Mixpanel, or similar
5. **Error Tracking** - Setup Sentry, Rollbar, or similar error monitoring
6. **Performance Monitoring** - Configure performance monitoring and alerts
7. **Database Backup** - Setup automated database backups
8. **CI/CD Pipeline** - Configure automated deployment pipeline
9. **Security Audit** - Run security scan and fix vulnerabilities
10. **Load Testing** - Perform load testing and optimize
11. **SEO & Meta Tags** - Configure SEO metadata, OpenGraph, Twitter cards
12. **Legal Documents** - Privacy Policy, Terms of Service, Cookie Policy
13. **CDN Configuration** - Setup CDN for static assets
14. **Email Service** - Configure transactional email service
15. **Staging Environment Test** - Full testing on staging environment
16. **Production Deployment** - Deploy application to production
17. **Post-Deploy Smoke Test** - Verify critical functionality after deployment
18. **Monitoring & Alerts** - Setup uptime monitoring and alert notifications

## Getting Started

### Installation

Install dependencies (if not already installed):

```bash
npm install
```

## Setup & Installation

### Prerequisites

- Node.js 18+ installed
- MySQL database server
- Database credentials (host, port, database name, user, password)

### Installation Steps

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Configure MySQL environment variables in `.env`:

```env
MYSQL_HOST=your-mysql-host
MYSQL_PORT=3306
MYSQL_DATABASE=your-database-name
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-mysql-password
```

3. The database tables will be created automatically on first run.

#### Updating existing databases

If you're upgrading an existing installation, run the archived-projects migration to add the new columns:

```bash
npm run migrate:archive
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage Guide

### Two Powerful Views

#### 1. Dashboard View (Project-Centric)

Perfect for managing individual projects and their full task lists.

- See all projects as cards
- Expand/collapse projects
- Add custom tasks per project
- Detailed progress tracking

#### 2. Table View (Task-Centric) ⭐ NEW

Perfect for batch processing the same task across multiple projects.

**Enhanced Visual Design:**

- **Prominent Project Headers**: Each project column shows:
  - Project number badge
  - Full project name
  - Project URL
  - Visual progress bar
  - Task completion count
- **Numbered Task Rows**: Easy to reference and discuss
- **Large Interactive Controls**: Bigger checkboxes and dropdowns for easy clicking
- **Completion Status Cards**: Color-coded boxes around checkboxes
- **Status Labels**: Clear labeling of checkbox and dropdown purpose
- **Alternating Row Colors**: Easier to scan across many projects
- **Sticky Headers & Columns**: Task details and progress always visible

**Key Features:**

- See all projects as columns, tasks as rows
- Complete the same task for all projects at once
- Filter by category or view all tasks
- Group by task or by category
- Real-time progress stats for each task
- Color-coded status indicators (green=complete, blue=in-progress, red=blocked)
- Visual completion checkmarks for 100% tasks

**Example Use Case**: You need to add SSL certificates to 5 projects. In Table View, find the "SSL Certificate" row and check it off for all 5 projects without switching contexts.

### Using Table View for Efficient Batch Processing

1. Click "Table View" button in the dashboard header
2. You'll see a spreadsheet-like interface:
   - **Rows**: Each unique task name across all projects
   - **Columns**: Each project
   - **Cells**: Checkbox + status dropdown for that task in that project
3. **Filter Options**:
   - Select category filter to see only specific task types
   - Toggle "By Task" or "By Category" grouping
4. **Complete Tasks Horizontally**:
   - Find a task you want to work on (e.g., "Analytics Integration")
   - Check it off for all projects that have it
   - Update status for each project individually
5. **Progress Tracking**:
   - Right column shows completion % for each task across all projects
   - Top stats show overall progress

**Pro Tip**: Use Table View when you're in "task mode" (e.g., setting up all SSL certificates) and Dashboard View when you're in "project mode" (e.g., focusing on one specific launch).

### Archiving Projects

- Hover a project header in Table View and click the archive icon to move it out of the active list.
- Archived projects disappear from active views and can be brought back anytime.
- Use the **Active / Archived** toggle in the Table View header to review archived projects and restore them when needed.

### Creating a New Project

1. Click "New Project" in the top-right corner
2. **Choose your starting point**:
   - **With Default Tasks**: Includes all 18 pre-configured deployment checklist items (recommended)
   - **Empty Project**: Start from scratch with no tasks
3. Click "Create Project"
4. Edit the project name, description, URL, and target date by clicking on them

### Adding Custom Tasks

1. Open any project (click the arrow to expand if collapsed)
2. Click the "Add Custom Task" button
3. Fill in the task details:
   - **Task Name**: Brief title (required)
   - **Description**: Detailed explanation of what needs to be done
   - **Category**: Choose from 8 pre-defined categories
   - **Status**: Set initial status (Not Started, In Progress, etc.)
   - **Required**: Check if this task must be completed before deployment
4. Click "Add Task"

### Managing Tasks

Each task includes:

- **Checkbox**: Mark as complete/incomplete
- **Task Name & Description**: Full details of what's needed
- **Category Badge**: Visual category indicator (color-coded)
- **Status Dropdown**: Track current status (Not Started, In Progress, Completed, Blocked)
- **Notes Button**: Add detailed notes, assignee info, or links
- **Delete Button**: Remove tasks (appears on hover)

### Deleting Tasks

- Hover over any task to reveal the delete button (trash icon)
- Click the delete button and confirm
- This works for both default and custom tasks

### Status Indicators

- **Green Badge "Ready to Deploy"**: All required tasks are completed
- **Target Date Colors**:
  - 🟢 Green: 7+ days remaining
  - 🟡 Yellow: Less than 7 days remaining
  - 🔴 Red: Past due date

### Category Filtering

Click any category button to filter tasks:

- All Tasks
- Infrastructure
- Security
- Monitoring
- DevOps
- Testing
- Marketing
- Legal
- Deployment

### Progress Tracking

Two progress indicators per project:

1. **Overall Progress**: All tasks (optional + required)
2. **Required Tasks**: Only critical deployment requirements

## Customization

### Adding New Categories

To add a new category for tasks:

1. Open `src/components/ProjectChecklist.js`
2. Add your category to the `categoryColors` object with a color scheme:

```javascript
const categoryColors = {
  Infrastructure: "bg-blue-100 text-blue-700 border-blue-200",
  YourCategory: "bg-purple-100 text-purple-700 border-purple-200",
  // ... other categories
};
```

### Modifying Default Checklist

To change the default tasks that appear when creating a new project:

Edit `DEPLOYMENT_CHECKLIST` in `src/app/page.js`:

```javascript
{
  id: 'your-task-id',
  name: 'Task Name',
  description: 'Detailed description',
  category: 'Infrastructure',
  required: true // or false for optional
}
```

### Customizing the UI

Modify colors and styles:

- **Header gradient**: `from-slate-800 to-slate-900` in ProjectChecklist.js
- **Progress bars**: `from-green-400 to-emerald-500`
- **Button colors**: Update gradient classes in both files
- **Category colors**: Modify the `categoryColors` object

## Production Deployment

### Required Environment Variables

For production deployment in Docker, you must set these environment variables:

```bash
# Authentication
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Database
MYSQL_HOST=<your-database-host>
MYSQL_PORT=3306
MYSQL_DATABASE=<your-database-name>
MYSQL_USER=<your-database-user>
MYSQL_PASSWORD=<your-database-password>

# Node environment
NODE_ENV=production
```

**Important**: Never commit `.env` files. Always use environment variables in production.

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Docker Compose Deployment

Create an untracked `.env` containing the variables above, then build and start:

```bash
docker compose up -d --build
```

The Node 22 container runs the Next.js standalone server as a non-root user on port 3000. Compose binds it to `127.0.0.1:3017`. Configure the host reverse proxy separately when public access is required, and preserve its existing OAuth domain and cookie settings.

The lockfile pins the security-patched Next.js 15.5.29 and React 19.1.10 releases. The `sharp` override keeps image processing on the patched 0.35.5 backend. Rebuild the image after dependency updates; restarting the old image does not update its packages.

### Troubleshooting PKCE Errors

If you see `InvalidCheck: pkceCodeVerifier value could not be parsed` errors:

1. **Verify NEXTAUTH_URL** matches your actual domain
2. **Check NEXTAUTH_SECRET** is set and the same across all instances
3. **Ensure cookies are preserved** between OAuth redirects (check nginx config)
4. **Verify NODE_ENV=production** is set for secure cookies

## Project Structure

```
src/
├── app/
│   ├── layout.js           # Root layout
│   ├── page.js             # Main dashboard with deployment checklist
│   ├── globals.css         # Global styles
│   └── favicon.ico         # App icon
└── components/
    └── ProjectChecklist.js # Project card component with tasks
```

## Technologies Used

- **Next.js 15**: React framework with App Router and Turbopack
- **React 19**: JavaScript library for building user interfaces
- **Tailwind CSS**: Utility-first CSS framework
- **JavaScript**: No TypeScript for simplicity and quick iteration

## Key Design Decisions

### Standardized Checklist

All projects share the same deployment checklist to ensure consistency and completeness. This SaaS approach means:

- No missed steps across different projects
- Easier training for team members
- Consistent deployment quality
- Industry best practices baked in

### Professional SaaS Interface

- Clean, modern design suitable for enterprise use
- Dashboard-style overview with key metrics
- Color-coded visual indicators for quick scanning
- Collapsible sections for managing many projects
- Inline editing for efficient workflow

### Flexible but Structured

- Required vs optional tasks allow flexibility
- Notes field for project-specific details
- Status tracking beyond simple checkboxes
- Category filtering for focused workflows

## Use Cases

- **Development Teams**: Track multiple client projects going live
- **DevOps Engineers**: Ensure deployment best practices
- **Product Managers**: Monitor project readiness
- **Freelancers**: Professional client project tracking
- **Agencies**: Standardize deployment across clients

## Future Enhancement Ideas

- Data persistence (localStorage or database)
- Team collaboration features
- Email notifications for approaching deadlines
- Template customization per project type
- Export reports (PDF, CSV)
- Integration with CI/CD tools
- Time tracking per task
- Audit trail of changes

## License

This project is open source and available for personal and commercial use.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 🆕 Recent Updates - Enhanced Project Creation

### New Features (January 2025)

We've significantly enhanced the project creation experience with powerful new features:

#### 🎯 Multiple Project Types

- **6 pre-configured templates** instead of just 2 options
- Choose from: Production Deployment, Website Launch, API Service, Mobile App, SaaS Product, or Custom
- Each type comes with tailored preset tasks relevant to that project type

#### ✏️ Edit Tasks During Creation

- **Review and customize** preset tasks before creating your project
- **Add custom tasks** with full details (name, description, category, status)
- **Remove unwanted tasks** from the preset list
- **Edit task details** inline with immediate feedback
- **Toggle required status** for any task

#### 📂 10 Task Categories

Organize tasks across 10 categories:

- Infrastructure, Security, Monitoring, DevOps, Testing
- Marketing, Legal, Deployment, Features, Documentation

### Quick Start

1. Click **"New Project"** on the dashboard
2. **Select a project type** that matches your needs
3. **Customize tasks** (optional):
   - Click "Add Task" to add custom tasks
   - Click edit icon to modify tasks
   - Click delete icon to remove tasks
4. Click **"Create Project"**

### Documentation

- **📖 [Quick Start Guide](QUICK_START.md)** - Get started in 2 minutes
- **📚 [Feature Summary](FEATURE_SUMMARY.md)** - Detailed feature overview
- **🔧 [Technical Docs](PROJECT_CREATION_ENHANCEMENT.md)** - Developer documentation
- **📋 [Migration Guide](MIGRATION_GUIDE.md)** - User adoption guide
- **📝 [Changes Summary](CHANGES_SUMMARY.md)** - Complete change log

### What's Changed

**New Files:**

- `src/config/projectTypes.js` - Project type definitions and templates
- `src/components/CreateProjectModal.js` - New interactive creation modal

**Updated Files:**

- `src/components/DashboardClient.js` - Integrated new modal component

### Compatibility

✅ **100% Backward Compatible**

- No database migration required
- Existing projects unchanged
- All existing features work as before
- Can be safely rolled back if needed

### Project Types Available

| Type                  | Icon | Tasks | Description                           |
| --------------------- | ---- | ----- | ------------------------------------- |
| Production Deployment | 🚀   | 12    | Deploy web applications to production |
| Website Launch        | 🌐   | 10    | Launch marketing or company websites  |
| API Service           | ⚡   | 10    | Deploy REST or GraphQL APIs           |
| Mobile App            | 📱   | 10    | Launch iOS/Android applications       |
| SaaS Product          | 💼   | 12    | Launch SaaS web applications          |
| Custom Project        | ✨   | 0     | Start from scratch                    |

### Try It Now

Test the new features immediately:

```bash
# Start the development server
npm run dev

# Navigate to http://localhost:3000/dashboard
# Click "New Project" and explore the new modal!
```

### Benefits

**For Users:**

- ⚡ **Faster setup** - Start with relevant preset tasks
- 🎯 **More accurate** - Tailored templates for different project types
- 🔧 **Fully customizable** - Edit everything before creating
- 💾 **No rework** - Get it right the first time

**For Developers:**

- 📦 **Easy to extend** - Add new project types in one file
- 🧩 **Modular** - Clean separation of concerns
- 🔄 **Reusable** - Share templates across types
- 📚 **Well documented** - Comprehensive guides included

### Feedback & Support

Have suggestions or found an issue?

- Check the [troubleshooting guide](MIGRATION_GUIDE.md#troubleshooting)
- Review [FAQ section](MIGRATION_GUIDE.md#frequently-asked-questions)
- Check browser console for errors
- Reach out to the development team

---

**Version:** 1.0.0 (Enhanced Project Creation)  
**Status:** ✅ Production Ready  
**Last Updated:** January 2025
