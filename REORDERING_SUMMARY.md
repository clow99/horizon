# Drag-and-Drop Project Reordering - Implementation Summary

## ✅ What Was Added

### 1. Database Schema
- **New Column**: `display_order INT` in `projects` table
- **Purpose**: Store custom project order per user
- **Migration Script**: `scripts/add-display-order.js`

### 2. API Endpoint
- **Route**: `/api/projects/order` (PUT)
- **File**: `src/app/api/projects/order/route.js`
- **Function**: Saves new project order to database
- **Security**: Validates user ownership before updating

### 3. Frontend Features
- **Drag Handle**: Visual indicator (≡ icon) at top of each project column
- **HTML5 Drag-and-Drop**: Native browser API for smooth experience
- **Visual Feedback**: 
  - Dragged column becomes semi-transparent
  - Cursor changes to `cursor-move`
  - "Saving order..." indicator during save
- **Optimistic Updates**: UI updates immediately, saves in background

### 4. State Management
- **Local State**: TableView manages its own project array for reordering
- **Parent Sync**: useEffect syncs with parent when external updates occur
- **Dual Updates**: Both local state and parent state updated for task changes

## 🔧 How to Use

### For Users:
1. Go to the Table View page
2. Look for the drag handle (≡) at the top of each project column
3. Click and hold on the handle
4. Drag left or right to reorder
5. Release to drop in new position
6. Order automatically saves and persists

### For Developers:
1. **Run Migration** (when database is available):
   ```bash
   node scripts/add-display-order.js
   ```

2. **Manual SQL** (alternative):
   ```sql
   ALTER TABLE projects ADD COLUMN display_order INT DEFAULT 0 AFTER user_id;
   
   UPDATE projects p
   JOIN (
     SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id ASC) as rn
     FROM projects
   ) ranked ON p.id = ranked.id
   SET p.display_order = ranked.rn - 1;
   ```

## 📝 Technical Details

### Drag-and-Drop Flow:
1. `handleDragStart` - User clicks drag handle, stores dragged project ID
2. `handleDragOver` - User drags over another column, prevents default
3. `handleDrop` - User releases, reorders array, saves to server
4. `handleDragEnd` - Cleanup, resets drag state

### State Updates:
```javascript
// Reorder locally
setProjects(newProjects);

// Save to server
await fetch('/api/projects/order', {
  method: 'PUT',
  body: JSON.stringify({ projectOrder: projectIds })
});
```

### Database Query:
```sql
SELECT * FROM projects 
WHERE user_id = ? 
ORDER BY 
  CASE WHEN display_order IS NOT NULL THEN display_order ELSE id END ASC,
  id ASC
```

## 🎯 Benefits

1. **User Control**: Users can organize projects in any order they want
2. **Persistent**: Order saves across sessions
3. **Per-User**: Each user has their own custom order
4. **Graceful Fallback**: Works even if migration hasn't run (uses ID order)
5. **No Page Refresh**: Drag-and-drop with instant feedback
6. **Error Handling**: Failed saves don't break the UI

## 📂 Files Modified

| File | Changes |
|------|---------|
| `src/components/TableView.js` | Added drag-and-drop handlers, local state management |
| `src/lib/server/projects.js` | Updated query to use display_order |
| `src/app/api/projects/order/route.js` | New API endpoint (CREATE) |
| `scripts/add-display-order.js` | Database migration script (CREATE) |

## 🔒 Security

- ✅ User authentication required (via NextAuth session)
- ✅ Project ownership verified before updates
- ✅ Database transaction ensures atomic updates
- ✅ Rollback on error

## 🚀 Next Steps

**To activate the feature:**
1. Ensure MySQL database is running
2. Run migration: `node scripts/add-display-order.js`
3. Refresh the table view page
4. Start dragging projects!

**Note**: Feature works without migration, but order won't persist.
