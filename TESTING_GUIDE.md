# Testing Guide - Enhanced Project Creation

## Quick Test (2 minutes)

### Test 1: Basic Project Creation with Preset Tasks

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Navigate to dashboard:**
   - Open http://localhost:3000/dashboard
   - Log in if needed

3. **Open project creation modal:**
   - Click the "New Project" button
   - You should see a modal with 6 project type cards

4. **Select a project type:**
   - Click on "🌐 Website Launch"
   - Modal should transition to Step 2
   - You should see 10 preset tasks

5. **Create the project:**
   - Click "Create Project" button
   - Modal should close
   - New project should appear on dashboard with 10 tasks

**Expected Result:** ✅ Project created with preset tasks from Website Launch template

---

### Test 2: Custom Task Creation

1. **Open project creation modal:**
   - Click "New Project" button
   - Select "⚡ API Service"

2. **Add a custom task:**
   - Click "Add Task" button
   - Fill in:
     - Name: "Setup API Rate Limiting"
     - Description: "Implement rate limiting with Redis"
     - Category: "Security"
     - Status: "Not Started"
     - Check "Required for deployment"
   - Click "Add Task"

3. **Verify the task was added:**
   - You should now see 11 tasks (10 preset + 1 custom)
   - Your custom task should appear in the list

4. **Create the project:**
   - Click "Create Project"
   - Verify the project has 11 tasks

**Expected Result:** ✅ Project created with 10 preset + 1 custom task

---

### Test 3: Edit Preset Task

1. **Open project creation modal:**
   - Click "New Project"
   - Select "📱 Mobile App"

2. **Edit a task:**
   - Find "Push Notifications" task
   - Click the edit icon (pencil)
   - Change name to: "Push Notifications (FCM)"
   - Change description to: "Setup Firebase Cloud Messaging"
   - Click "Done"

3. **Create the project:**
   - Click "Create Project"
   - Open the created project
   - Verify the task name and description were updated

**Expected Result:** ✅ Task details successfully edited

---

### Test 4: Remove Tasks

1. **Open project creation modal:**
   - Click "New Project"
   - Select "💼 SaaS Product"

2. **Remove tasks:**
   - Find "Customer Support" task
   - Click the delete icon (trash)
   - Confirm deletion
   - Task should be removed from list

3. **Create the project:**
   - You should now have 11 tasks instead of 12
   - Click "Create Project"

**Expected Result:** ✅ Project created without removed task

---

### Test 5: Custom Project (Empty)

1. **Open project creation modal:**
   - Click "New Project"
   - Select "✨ Custom Project"

2. **Verify empty state:**
   - You should see "No tasks yet" message
   - No preset tasks loaded

3. **Add your own tasks:**
   - Click "Add Task"
   - Add: "Initial Task"
   - Click "Add Task" again
   - Add: "Second Task"

4. **Create the project:**
   - Click "Create Project"
   - Project should have exactly 2 tasks

**Expected Result:** ✅ Empty project with only custom tasks

---

### Test 6: Toggle Required Status

1. **Open project creation modal:**
   - Click "New Project"
   - Select "🚀 Production Deployment"

2. **Toggle required status:**
   - Find a task marked as "Required"
   - Click the priority icon (flag/arrow)
   - Required badge should disappear
   - Click again to toggle back

3. **Create the project:**
   - Click "Create Project"

**Expected Result:** ✅ Required status toggles correctly

---

### Test 7: Navigation Between Steps

1. **Open project creation modal:**
   - Click "New Project"
   - Select any project type

2. **Go back:**
   - Click "Back" button
   - You should return to project type selection
   - No tasks should be visible

3. **Select different type:**
   - Click "🌐 Website Launch"
   - Different tasks should load

4. **Cancel:**
   - Click "Cancel" button
   - Modal should close completely

**Expected Result:** ✅ Navigation works correctly

---

## Full Test Suite

### Functional Tests

- [ ] All 6 project types load correctly
- [ ] Preset tasks load for each type
- [ ] Can add custom tasks
- [ ] Can edit task name
- [ ] Can edit task description
- [ ] Can change task category
- [ ] Can change task status
- [ ] Can toggle required status
- [ ] Can delete tasks
- [ ] Project creation succeeds
- [ ] Tasks persist after creation
- [ ] Projects appear on dashboard

### UI/UX Tests

- [ ] Modal opens smoothly
- [ ] Modal closes on Cancel
- [ ] Modal closes on Create
- [ ] Step transitions are smooth
- [ ] Form validation works
- [ ] Error messages display correctly
- [ ] Success feedback provided
- [ ] Responsive on mobile (if applicable)
- [ ] Keyboard navigation works
- [ ] Icons and colors display correctly

### Edge Cases

- [ ] Can create project with 0 tasks
- [ ] Can create project with 30+ tasks
- [ ] Long task names display correctly
- [ ] Long descriptions don't break layout
- [ ] Special characters in names work
- [ ] Can edit immediately after adding
- [ ] Can delete immediately after adding
- [ ] Modal works with slow network
- [ ] Multiple rapid clicks handled gracefully

### Browser Compatibility

Test in these browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Automated Test Commands

```bash
# Test project types config loads
node -e "console.log(require('./src/config/projectTypes.js').getProjectTypes())"

# Expected output: Array of 6 project types

# Test helper function
node -e "console.log(require('./src/config/projectTypes.js').createTasksFromProjectType('website'))"

# Expected output: Array of 10 tasks for website launch
```

---

## Performance Testing

### Load Time Test

1. Open browser DevTools (F12)
2. Go to Network tab
3. Hard refresh (Ctrl+Shift+R)
4. Check:
   - [ ] Modal loads in <100ms
   - [ ] No console errors
   - [ ] No 404s for resources

### Memory Test

1. Open browser DevTools
2. Go to Performance/Memory tab
3. Create 10 projects in a row
4. Check:
   - [ ] No memory leaks
   - [ ] Memory usage stable
   - [ ] No performance degradation

---

## Common Issues & Solutions

### Issue: Modal doesn't open
**Solution:** 
- Check browser console for errors
- Verify React DevTools shows component mounted
- Clear cache and hard refresh

### Issue: Tasks don't save
**Solution:**
- Check Network tab for API errors
- Verify authentication token is valid
- Check database connection

### Issue: Tasks duplicate
**Solution:**
- Check for double-click on Create button
- Verify optimistic updates working correctly
- Check for race conditions

### Issue: Styling looks wrong
**Solution:**
- Verify Tailwind CSS is loaded
- Check for CSS conflicts
- Clear browser cache

---

## Regression Testing

Ensure existing features still work:

- [ ] Can create projects with old flow (if applicable)
- [ ] Existing projects load correctly
- [ ] Task editing works in project view
- [ ] Project deletion works
- [ ] Table view works
- [ ] Sorting/filtering works
- [ ] User authentication works
- [ ] All other dashboard features work

---

## Test Data

Use these test cases for comprehensive testing:

### Test Project 1: Minimal
- Type: Custom Project
- Tasks: 0
- Purpose: Test empty project creation

### Test Project 2: Standard
- Type: Website Launch
- Tasks: 10 preset
- Purpose: Test standard flow

### Test Project 3: Heavy
- Type: SaaS Product
- Tasks: 12 preset + 10 custom = 22 total
- Purpose: Test with many tasks

### Test Project 4: Custom Categories
- Type: Custom Project
- Tasks: 1 task in each of the 10 categories
- Purpose: Test all categories

### Test Project 5: Edge Case
- Type: Production Deployment
- Tasks: Include tasks with:
  - Very long names (100+ chars)
  - Special characters (!@#$%^&*)
  - Unicode characters (emoji, accents)
  - Empty descriptions
- Purpose: Test edge cases

---

## Acceptance Criteria

This feature is ready for production when:

✅ All functional tests pass
✅ All UI/UX tests pass
✅ All edge cases handled
✅ Works in all target browsers
✅ No console errors
✅ No performance issues
✅ Documentation is complete
✅ Code is reviewed
✅ No breaking changes to existing features

---

## Test Results Template

```
Date: _____________
Tester: _____________
Environment: _____________

Test Results:
- Basic Creation: ☐ Pass ☐ Fail
- Custom Tasks: ☐ Pass ☐ Fail
- Edit Tasks: ☐ Pass ☐ Fail
- Remove Tasks: ☐ Pass ☐ Fail
- Empty Project: ☐ Pass ☐ Fail
- Toggle Required: ☐ Pass ☐ Fail
- Navigation: ☐ Pass ☐ Fail

Browser Compatibility:
- Chrome: ☐ Pass ☐ Fail
- Firefox: ☐ Pass ☐ Fail
- Safari: ☐ Pass ☐ Fail
- Edge: ☐ Pass ☐ Fail

Notes:
_________________________________
_________________________________
_________________________________

Overall Status: ☐ PASS ☐ FAIL
Sign-off: _____________
```

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** Ready for Testing
