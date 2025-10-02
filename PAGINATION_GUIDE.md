# Pagination Guide for Table View

## Overview
The table view now supports pagination to prevent horizontal scrolling and provide better navigation when managing multiple projects. Instead of displaying all projects horizontally, projects are shown in pages with configurable page sizes.

## Features

### 1. **Projects Per Page Selector**
- Located in the top-right corner of the table view
- Options: 2, 3, 4, 6, 8, or All projects
- Default: 4 projects per page
- Automatically resets to page 1 when changed

### 2. **Page Navigation**
- **Previous/Next Buttons**: Navigate between pages
- **Page Indicator**: Shows "Page X of Y (start-end of total)"
  - Example: "Page 1 of 3 (1-4 of 10)"
- **Smart Disabled State**: Previous disabled on first page, Next disabled on last page
- Only appears when there are multiple pages

### 3. **Global Project Numbering**
- Project numbers remain consistent across pages
- Example: Page 2 with 4 per page shows projects #5, #6, #7, #8
- Makes it easy to reference specific projects

## User Experience

### Navigation Flow
1. User lands on table view → sees first page of projects
2. Can change projects per page from dropdown
3. Use Previous/Next buttons to navigate
4. Page indicator shows current position

### Drag-and-Drop Compatibility
- **Works Across Pages**: You can reorder projects even when paginated
- **Order Persists**: Changes are saved to database with `display_order`
- **Visual Feedback**: Dragging shows opacity change and saving indicator
- **Automatic Refresh**: After reordering, the view updates with new positions

### When to Use Different Page Sizes
- **2-3 projects**: Detailed focus on specific projects
- **4 projects** (default): Balanced view for most workflows
- **6-8 projects**: Wider comparison across more projects
- **All projects**: Overview mode, similar to previous horizontal scroll

## Technical Implementation

### State Management
```javascript
const [currentPage, setCurrentPage] = useState(0); // Zero-indexed
const [projectsPerPage, setProjectsPerPage] = useState(4);
```

### Calculations
```javascript
const totalPages = Math.ceil(projects.length / projectsPerPage);
const startIndex = currentPage * projectsPerPage;
const endIndex = Math.min(startIndex + projectsPerPage, projects.length);
const paginatedProjects = projects.slice(startIndex, endIndex);
```

### Rendering
- Project headers use `paginatedProjects` instead of full `projects` array
- Task rows also iterate over `paginatedProjects`
- Global index calculated: `globalIdx = startIndex + idx`

## UI Components

### Pagination Controls Layout
```
┌─────────────────────────────────────────────────────────────┐
│  [Stats: 10 Projects | 85% Complete | 120/140 Tasks]        │
│                                                               │
│  [Show: [4 ▼] projects]  [◀] Page 2 of 3 (5-8 of 10) [▶]   │
└─────────────────────────────────────────────────────────────┘
```

### Styling
- **Projects Per Page**: Gray background with border, white dropdown
- **Navigation Buttons**: Border with hover effect, disabled opacity
- **Page Indicator**: Gray background showing page info and range
- **Compact Design**: Fits in existing stats header area

## Benefits

### 1. **No Horizontal Scroll**
- Eliminates need to scroll right to see more projects
- Keeps task names always visible on the left

### 2. **Better Focus**
- Focus on a subset of projects at a time
- Reduces cognitive load when managing many projects

### 3. **Flexible Viewing**
- Adjust page size based on screen width and preference
- Can still view all projects at once with "All" option

### 4. **Maintains Features**
- Drag-and-drop reordering works across pages
- All task operations (check, notes, edit) work normally
- Filtering and grouping still functional

## Related Features
- **Project Reordering**: See `PROJECT_REORDERING.md`
- **Drag-and-Drop**: See `DRAG_DROP_GUIDE.md`
- **Table View**: See `TABLE_VIEW_USAGE.md`

## Future Enhancements
- Keyboard navigation (arrow keys for prev/next)
- Jump to page input field
- Remember page size preference (localStorage)
- URL params for page number (bookmarkable)
- Smooth transitions when changing pages
