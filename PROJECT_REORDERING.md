# Project Reordering Feature - Database Migration

## Overview
This feature allows users to drag-and-drop projects to reorder them in the table view. The order is persisted in the database.

## Database Migration Required

Before using this feature, you need to add the `display_order` column to the projects table.

### Running the Migration

1. Ensure your MySQL database is running
2. Verify your database connection settings in `.env`
3. Run the migration script:

```bash
node scripts/add-display-order.js
```

### What the Migration Does

1. Adds a `display_order INT` column to the `projects` table
2. Initializes `display_order` for existing projects based on their current ID order
3. Each user's projects get their own sequential ordering (0, 1, 2, ...)

### Manual Migration (Alternative)

If you prefer to run the SQL manually:

```sql
-- Add the column
ALTER TABLE projects 
ADD COLUMN display_order INT DEFAULT 0 AFTER user_id;

-- Initialize display_order for existing projects
UPDATE projects p
JOIN (
  SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id ASC) as rn
  FROM projects
) ranked ON p.id = ranked.id
SET p.display_order = ranked.rn - 1;
```

## Features

### Drag and Drop
- Click and hold on the drag handle icon (three horizontal lines) at the top of each project column
- Drag left or right to reorder
- Drop to place in new position
- Order is automatically saved to the database

### Visual Feedback
- Dragged column becomes semi-transparent
- Cursor changes to indicate draggable area
- "Saving order..." indicator appears during save
- Order persists across page refreshes and sessions

### How It Works

1. **Frontend**: TableView component uses HTML5 drag-and-drop API
2. **API**: `/api/projects/order` endpoint accepts new project order
3. **Database**: `display_order` column stores custom ordering
4. **Query**: Projects are fetched ordered by `display_order` (or `id` as fallback)

## Graceful Degradation

The feature works even if the migration hasn't been run:
- Projects will display in ID order if `display_order` column doesn't exist
- Drag-and-drop UI will work but order won't persist
- No errors will occur

## Files Modified

- `src/components/TableView.js` - Added drag-and-drop UI and handlers
- `src/lib/server/projects.js` - Updated query to use display_order
- `src/app/api/projects/order/route.js` - New API endpoint for saving order
- `scripts/add-display-order.js` - Database migration script
