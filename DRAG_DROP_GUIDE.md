# 🎯 Project Reordering Feature - Quick Start

## What You Get

✨ **Drag-and-drop project reordering** in the table view - organize your projects exactly how you want them!

## Visual Guide

### Before:
```
┌─────────────────────────────────────────────────────┐
│ Table View                                          │
├─────────────────────────────────────────────────────┤
│ Project 1  │  Project 2  │  Project 3  │  Project 4 │
├────────────┼─────────────┼─────────────┼────────────┤
│    ☐       │     ☐       │     ☑       │     ☐      │
│    ☐       │     ☑       │     ☐       │     ☑      │
└────────────┴─────────────┴─────────────┴────────────┘
```

### After Dragging Project 3 to First Position:
```
┌─────────────────────────────────────────────────────┐
│ Table View                                          │
├─────────────────────────────────────────────────────┤
│ Project 3  │  Project 1  │  Project 2  │  Project 4 │
├────────────┼─────────────┼─────────────┼────────────┤
│    ☑       │     ☐       │     ☐       │     ☐      │
│    ☐       │     ☐       │     ☑       │     ☑      │
└────────────┴─────────────┴─────────────┴────────────┘
```

## How to Use

### Step 1: Locate the Drag Handle
Look at the top of each project column. You'll see:
```
   ≡  ← Drag handle (three horizontal lines)
  [1]
Project Name
```

### Step 2: Click and Hold
- Click on the **≡ icon**
- Hold down your mouse button

### Step 3: Drag
- Move your mouse left or right
- The column will become semi-transparent while dragging
- You'll see your cursor change to indicate you can move it

### Step 4: Drop
- Release the mouse button at your desired position
- The column snaps into place
- You'll see "Saving order..." briefly

### Step 5: Done!
- Your order is saved automatically
- It persists across browser refreshes
- Each user has their own custom order

## Features

- ✅ **Visual Feedback**: Dragged columns are semi-transparent
- ✅ **Auto-Save**: Order saves automatically when you drop
- ✅ **Persistent**: Your order is remembered forever
- ✅ **Per-User**: Each team member can have their own order
- ✅ **Instant**: No page refresh needed

## Database Setup Required

⚠️ **First-time setup**: Run this command once to enable persistence:

```bash
node scripts/add-display-order.js
```

**Without this migration:**
- Drag-and-drop will work
- But order won't persist after page refresh
- No errors will occur

**With this migration:**
- Order saves to database
- Persists forever
- Works across all devices

## Troubleshooting

### Order doesn't persist?
➤ Run the migration script: `node scripts/add-display-order.js`

### Can't drag projects?
➤ Make sure you're clicking on the **≡ icon** at the top of the column, not the project name

### "Saving order..." stuck?
➤ Check browser console for errors
➤ Verify API endpoint is working: `/api/projects/order`

### Want to reset to original order?
➤ Simply drag projects back to their original positions
➤ Or run: `UPDATE projects SET display_order = id WHERE user_id = YOUR_ID`

## Tips

💡 **Organize by priority**: Put urgent projects first
💡 **Group related projects**: Keep similar projects together  
💡 **Alphabetize**: Drag into A-Z order if you prefer
💡 **Hide less active**: Move completed projects to the end

Enjoy organizing your deployment tracker! 🚀
