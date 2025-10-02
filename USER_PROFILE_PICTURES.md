# User Profile Picture Feature

This document describes the implementation of displaying user profile pictures for the last person who updated/completed each task.

## Overview

When a user updates or completes a task in the table view, their profile picture will be displayed next to the task status. This provides visual accountability and helps team members quickly see who last worked on each task.

## Database Changes

### New Columns Added to `tasks` Table

Three new columns have been added to track the user who last updated each task:

```sql
ALTER TABLE tasks 
ADD COLUMN updated_by_user_id VARCHAR(36) NULL COMMENT 'User who last updated this task' AFTER completed_at;

ALTER TABLE tasks 
ADD COLUMN updated_by_user_name VARCHAR(255) NULL COMMENT 'Cached name of user who last updated' AFTER updated_by_user_id;

ALTER TABLE tasks 
ADD COLUMN updated_by_user_image TEXT NULL COMMENT 'Cached profile image URL of user who last updated' AFTER updated_by_user_name;

ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_updated_by_user 
FOREIGN KEY (updated_by_user_id) REFERENCES users(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE tasks 
ADD INDEX idx_updated_by_user_id (updated_by_user_id);
```

### Migration Script

Run the migration script to add these columns:

```bash
node scripts/add-updated-by-tracking.js
```

Or run the SQL commands directly in your MySQL client:

```sql
USE checklist;

ALTER TABLE tasks 
ADD COLUMN updated_by_user_id VARCHAR(36) NULL COMMENT 'User who last updated this task' AFTER completed_at,
ADD COLUMN updated_by_user_name VARCHAR(255) NULL COMMENT 'Cached name of user who last updated' AFTER updated_by_user_id,
ADD COLUMN updated_by_user_image TEXT NULL COMMENT 'Cached profile image URL of user who last updated' AFTER updated_by_user_name,
ADD CONSTRAINT fk_tasks_updated_by_user 
  FOREIGN KEY (updated_by_user_id) REFERENCES users(id) 
  ON DELETE SET NULL ON UPDATE CASCADE,
ADD INDEX idx_updated_by_user_id (updated_by_user_id);
```

## API Changes

### Updated `/api/projects/[id]` (PUT)

The API now automatically tracks user information when tasks are updated:

- When a task is updated, the current user's ID, name, and profile image are saved to the task
- This happens for both INSERT and UPDATE operations
- The user information is cached directly in the task record for performance

**Previous Behavior:**
```javascript
await query(
  'UPDATE tasks SET name = ?, category = ?, status = ?, ... WHERE id = ?',
  [task.name, task.category, task.status, ..., task.id]
);
```

**New Behavior:**
```javascript
await query(
  'UPDATE tasks SET name = ?, category = ?, status = ?, ..., updated_by_user_id = ?, updated_by_user_name = ?, updated_by_user_image = ? WHERE id = ?',
  [task.name, task.category, task.status, ..., session.user.id, session.user.name, session.user.image, task.id]
);
```

## UI Changes

### Table View Display

Profile pictures are now displayed in the table view next to each task's status dropdown:

**Visual Layout:**
```
[Checkbox] [Status Dropdown] [Profile Picture] [Delete Button]
```

**Features:**
- Profile picture is displayed as a small circular avatar (24x24px)
- Hover shows tooltip with user's name
- Only appears if the task has been updated by a user
- Responsive design that works with the existing layout

**Implementation:**
```jsx
{/* User Profile Picture - Shows who last updated */}
{task.updated_by_user_image && (
  <div className="flex-shrink-0" title={`Last updated by ${task.updated_by_user_name || 'Unknown'}`}>
    <img 
      src={task.updated_by_user_image} 
      alt={task.updated_by_user_name || 'User'} 
      className="w-6 h-6 rounded-full border border-gray-300 object-cover"
    />
  </div>
)}
```

## Benefits

1. **Accountability**: Team members can see who last worked on each task
2. **Collaboration**: Easy to identify who to reach out to for questions about a task
3. **Visual Tracking**: Quick visual indicator of team activity across projects
4. **No Performance Impact**: User data is cached in the task record, avoiding JOIN queries

## Data Privacy

- Profile pictures come from Google OAuth authentication
- Only authenticated users can see task data
- User information is automatically updated each time a task is modified
- If a user is deleted, their profile data is removed from tasks (SET NULL constraint)

## Testing

To test the feature:

1. Run the migration script or SQL commands
2. Restart your Next.js development server
3. Sign in with your Google account
4. Navigate to the Table View
5. Update any task status or check/uncheck a checkbox
6. Your profile picture should appear next to that task
7. Try with multiple users to see different profile pictures

## Troubleshooting

### Profile pictures not showing:
- Verify migration ran successfully: `SHOW COLUMNS FROM tasks;`
- Check that tasks have user data: `SELECT id, name, updated_by_user_name, updated_by_user_image FROM tasks LIMIT 5;`
- Ensure you're signed in with Google OAuth
- Check browser console for image loading errors

### Migration fails:
- Ensure MySQL is running
- Verify database credentials in `.env.local`
- Run SQL commands manually in your MySQL client
- Check that the `users` table exists (required for foreign key)

### Performance concerns:
- Profile pictures are cached in the task record (denormalized)
- No additional JOIN queries required
- Index on `updated_by_user_id` for efficient filtering
- Images loaded via CDN (Google's servers)
