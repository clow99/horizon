# Project Reordering Fix

## Issue

After removing local state from `TableView`, the drag-and-drop project reordering feature was broken. The code had a TODO comment where `setProjects` was removed.

## Root Cause

When we simplified state management to use props only (not local state), the `handleDrop` function could no longer update the project order directly:

```javascript
// This was removed when we eliminated local state
// setProjects(newProjects);

// This TODO was left
// TODO: Need to lift this state to parent or pass a callback
```

## Solution

**Implemented callback pattern** to lift the reordering logic to the parent component:

### 1. Added `onReorderProjects` Prop

**TableView.js:**
```javascript
export default function TableView({ 
  projects, 
  onUpdateProject, 
  onReorderProjects,  // NEW
  session 
}) {
```

### 2. Updated handleDrop to Call Parent

**TableView.js:**
```javascript
const handleDrop = async (e, targetProjectId) => {
  // ... drag and drop logic ...
  
  // Reorder projects array
  const newProjects = [...projects];
  const [removed] = newProjects.splice(draggedIndex, 1);
  newProjects.splice(targetIndex, 0, removed);

  // Call parent to update the projects order
  if (onReorderProjects) {
    onReorderProjects(newProjects);
  }
  
  // ... animation logic ...
  
  // Save to server
  await saveProjectOrder(newProjects.map(p => p.id));
};
```

### 3. Implemented Handler in TableClient

**TableClient.js:**
```javascript
const reorderProjects = (newProjects) => {
  console.log('TableClient.reorderProjects called:', newProjects);
  
  // Update state with new order
  setProjects(newProjects);
  
  // Save the new order to the server
  const projectIds = newProjects.map(p => p.id);
  saveProjectOrder(projectIds);
};

const saveProjectOrder = async (projectIds) => {
  try {
    const response = await fetch('/api/projects/order', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectOrder: projectIds })
    });

    if (!response.ok) {
      throw new Error('Failed to save project order');
    }
    
    console.log('Project order saved successfully');
  } catch (error) {
    console.error('Error saving project order:', error);
    showToast('Failed to save project order. Changes may not persist.', 'error');
  }
};

// Pass to TableView
<TableView 
  projects={projects} 
  onUpdateProject={updateProject} 
  onReorderProjects={reorderProjects}  // NEW
  session={session} 
/>
```

## How It Works

### Drag and Drop Flow

1. **User drags project header** → `handleDragStart` sets `draggedProjectId`
2. **User hovers over target** → `handleDragOver` sets `dragOverProjectId`
3. **User drops** → `handleDrop` executes:
   ```
   a. Calculate new order
   b. Call onReorderProjects(newProjects)
      └─> TableClient.reorderProjects()
          └─> setProjects(newProjects)  // Update UI
          └─> saveProjectOrder()        // Save to DB
   c. Play FLIP animation
   d. Clean up drag state
   ```

### FLIP Animation

The drag-and-drop uses FLIP (First, Last, Invert, Play) technique:
- **First**: Capture positions before reorder
- **Last**: Capture positions after reorder  
- **Invert**: Apply transform to make items look like they're still in old position
- **Play**: Animate transform to 0, smoothly moving to new position

This creates a smooth, professional reordering animation.

## API Endpoint

**`/api/projects/order`** - PUT request to save project order:

```javascript
PUT /api/projects/order
Body: { projectOrder: ['id1', 'id2', 'id3', ...] }

Response: 200 OK
```

Updates `display_order` field in database for proper persistence.

## Testing

✅ Drag project header left/right
✅ See smooth FLIP animation
✅ Projects reorder in UI
✅ Order persists in database
✅ Refresh page - order is maintained
✅ Other users don't see your custom order (per-user)
✅ Works with pagination (reorders all projects, not just visible ones)

## Files Changed

- ✅ `src/components/TableView.js` - Added `onReorderProjects` prop, call parent on drop
- ✅ `src/components/TableClient.js` - Implemented `reorderProjects` and `saveProjectOrder`

## Related

This complements the state management fixes:
- STATE_MANAGEMENT_FIX.md - Single source of truth (TableClient)
- INSTANT_CHECKBOX_FIX.md - Optimistic updates pattern
- CHECKBOX_FINAL_FIX.md - Simplified object passing

Same pattern: **Child receives props, calls parent callbacks to request changes**.

## Future Enhancements

Potential improvements:
- Optimistic reordering (update DB in background)
- Drag preview ghost element
- Visual feedback for invalid drop targets
- Keyboard shortcuts for reordering
- Undo/redo for reordering
