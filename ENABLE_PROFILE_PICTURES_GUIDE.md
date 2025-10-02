# Enable Profile Pictures - Quick Guide

## The Issue

You're not seeing profile pictures because the database columns for tracking user updates don't exist yet.

## Solution: Add Database Columns

You need to run this SQL in your MySQL database to add the required columns:

### SQL to Run

```sql
-- Connect to your database first
USE checklist;

-- Add the three columns for user tracking
ALTER TABLE tasks 
ADD COLUMN updated_by_user_id VARCHAR(36) NULL COMMENT 'User who last updated this task' AFTER completed_at,
ADD COLUMN updated_by_user_name VARCHAR(255) NULL COMMENT 'Cached name of user who last updated' AFTER updated_by_user_id,
ADD COLUMN updated_by_user_image TEXT NULL COMMENT 'Cached profile image URL of user who last updated' AFTER updated_by_user_name;

-- Add foreign key constraint (optional but recommended)
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_updated_by_user 
  FOREIGN KEY (updated_by_user_id) REFERENCES users(id) 
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for better performance
ALTER TABLE tasks
ADD INDEX idx_updated_by_user_id (updated_by_user_id);

-- Verify the columns were added
SHOW COLUMNS FROM tasks;
```

## How to Run It

### Option 1: MySQL Workbench
1. Open MySQL Workbench
2. Connect to your database
3. Copy and paste the SQL above
4. Click the lightning bolt icon to execute

### Option 2: phpMyAdmin
1. Open phpMyAdmin
2. Select your `checklist` database
3. Go to the SQL tab
4. Paste the SQL above
5. Click "Go"

### Option 3: Command Line
```powershell
mysql -u your_username -p checklist < database/migration-add-user-tracking.sql
```

### Option 4: Node Script (if database is accessible)
```powershell
node scripts/add-updated-by-tracking.js
```

## After Running the SQL

Once the columns are added, you need to update the API to save user information:

### Update `src/app/api/projects/[id]/route.js`

Find these lines (around line 76 and 95):

**Change this UPDATE query:**
```javascript
// FROM:
await query(
  'UPDATE tasks SET name = ?, category = ?, status = ?, required = ?, notes = ?, completed_at = ? WHERE id = ?',
  [task.name, task.category || null, task.status || 'Not Started', task.required || false, task.notes || null, completedAt, task.id]
);

// TO:
await query(
  'UPDATE tasks SET name = ?, category = ?, status = ?, required = ?, notes = ?, completed_at = ?, updated_by_user_id = ?, updated_by_user_name = ?, updated_by_user_image = ? WHERE id = ?',
  [
    task.name,
    task.category || null,
    task.status || 'Not Started',
    task.required || false,
    task.notes || null,
    completedAt,
    session.user.id,
    session.user.name || null,
    session.user.image || null,
    task.id
  ]
);
```

**Change this INSERT query:**
```javascript
// FROM:
await query(
  'INSERT INTO tasks (id, project_id, name, category, status, required, notes, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  [taskId, id, task.name, task.category || null, task.status || 'Not Started', task.required || false, task.notes || null, completedAt]
);

// TO:
await query(
  'INSERT INTO tasks (id, project_id, name, category, status, required, notes, completed_at, updated_by_user_id, updated_by_user_name, updated_by_user_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  [
    taskId,
    id,
    task.name,
    task.category || null,
    task.status || 'Not Started',
    task.required || false,
    task.notes || null,
    completedAt,
    session.user.id,
    session.user.name || null,
    session.user.image || null
  ]
);
```

## Then Test It!

1. Restart your Next.js app (if running)
2. Go to the table view
3. Click a checkbox or change a status
4. You should now see your profile picture below the dropdown!

## Quick Check

To verify the columns exist, run this SQL:
```sql
SHOW COLUMNS FROM tasks LIKE 'updated_by_user%';
```

You should see 3 columns:
- `updated_by_user_id`
- `updated_by_user_name`
- `updated_by_user_image`

---

## Can't Access Database?

If you can't run the SQL, you have two options:

1. **Keep it disabled** - The app works fine without profile pictures
2. **Contact your database admin** - Send them the SQL above to run

The profile picture display is already built into the UI, it just needs the database columns to store the data!
