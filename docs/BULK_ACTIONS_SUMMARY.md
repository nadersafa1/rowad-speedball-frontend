# Bulk Actions Implementation Summary

## Overview

Bulk actions have been fully implemented and documented for the table-core system. Users can now select multiple rows and perform batch operations with customizable action buttons.

---

## What Was Implemented

### ✅ 1. Enhanced Players Table with Bulk Actions

**File**: `src/app/players/components/players-table-refactored.tsx`

**Features Added**:
- ✅ Bulk delete with confirmation dialog
- ✅ Dynamic action button labels (shows count: "Delete 5 players")
- ✅ Permission-based action visibility
- ✅ Loading states for async operations
- ✅ Player list preview in confirmation (for ≤5 selections)
- ✅ Memoized bulk actions configuration
- ✅ Clear selection handling
- ✅ Error handling with try/catch

**New Handlers**:
```typescript
- handleBulkDelete()             // Opens confirmation dialog
- handleConfirmBulkDelete()      // Executes deletion
- handleCancelBulkDelete()       // Cancels operation
```

**New States**:
```typescript
- bulkDeleteDialogOpen          // Dialog visibility
- isBulkDeleting                // Loading state
- bulkActions                   // Memoized actions array
```

### ✅ 2. Existing BulkActionsToolbar Component

**File**: `src/lib/table-core/components/BulkActionsToolbar.tsx`

**Already Supports**:
- ✅ Custom action buttons with icons
- ✅ Multiple button variants (default, destructive, outline, etc.)
- ✅ Async operation handling
- ✅ Loading states
- ✅ Disabled state management
- ✅ Custom children (for dropdowns, selectors, etc.)
- ✅ Responsive design (mobile-friendly)
- ✅ Selected count display

### ✅ 3. Row Selection Already Enabled

**File**: `src/config/tables/players.config.ts`

```typescript
features: {
  selection: true,  // ✅ Already enabled
  // ...
}
```

### ✅ 4. Selection Column Helper

**File**: `src/lib/table-core/utils/column-helpers.tsx`

```typescript
createSelectionColumn<TData>()  // ✅ Already exists
```

---

## Documentation Created

### 📚 1. Comprehensive Guide

**File**: `docs/BULK_ACTIONS_GUIDE.md`

**Contents**:
- Complete API reference
- 8+ common patterns with code examples
- Best practices
- Troubleshooting guide
- Real-world examples from Players table

**Sections**:
1. Enable Row Selection
2. Configure Bulk Actions
3. Built-in Features
4. Common Patterns
   - Bulk Delete with Confirmation
   - Bulk Export
   - Bulk Update with Dialog
   - Bulk Assign to Category
   - Custom Dropdown Actions
5. Example Implementation
6. API Reference
7. Best Practices
8. Troubleshooting

### 📚 2. Quick Start Guide

**File**: `docs/BULK_ACTIONS_QUICKSTART.md`

**Contents**:
- 8-step setup checklist
- Copy-paste code snippets
- Minimal working example
- Common action examples
- Troubleshooting tips

**Time to Implement**: ~5 minutes

### 📚 3. Updated Table Core Guide

**File**: `docs/table-core-guide.md`

**Updates**:
- Added reference to bulk actions guides
- Links to comprehensive and quick start guides

---

## How to Use Bulk Actions

### Quick Example

```typescript
// 1. Define actions
const bulkActions = React.useMemo(() => {
  const actions = []

  if (canDelete) {
    actions.push({
      label: `Delete ${selectedItems.length} items`,
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      onClick: handleBulkDelete,
    })
  }

  return actions
}, [canDelete, selectedItems.length, handleBulkDelete])

// 2. Render toolbar
{selectedItems.length > 0 && (
  <BulkActionsToolbar
    selectedCount={selectedItems.length}
    onClearSelection={handleClearSelection}
    actions={bulkActions}
  />
)}
```

---

## Available Bulk Action Types

### 1. Bulk Delete
```typescript
{
  label: 'Delete Selected',
  icon: <Trash2 />,
  variant: 'destructive',
  onClick: handleBulkDelete,
}
```

### 2. Bulk Export
```typescript
{
  label: 'Export Selected',
  icon: <Download />,
  variant: 'outline',
  onClick: () => exportToCSV(selectedItems, columns, filename),
}
```

### 3. Bulk Update
```typescript
{
  label: 'Update Status',
  icon: <Edit />,
  variant: 'default',
  onClick: handleBulkUpdate,
}
```

### 4. Bulk Archive
```typescript
{
  label: 'Archive Selected',
  icon: <Archive />,
  variant: 'secondary',
  onClick: handleBulkArchive,
}
```

### 5. Custom Actions
Add any custom action by providing a handler function!

---

## Features

### ✅ Dynamic Action Labels
```typescript
label: `Delete ${selectedItems.length} player${selectedItems.length !== 1 ? 's' : ''}`
// Output: "Delete 1 player" or "Delete 5 players"
```

### ✅ Permission-Based Actions
```typescript
if (canDelete) {
  actions.push({ /* delete action */ })
}

if (canUpdate) {
  actions.push({ /* update action */ })
}
```

### ✅ Loading States
```typescript
{isDeleting ? 'Deleting...' : 'Delete'}
```

### ✅ Confirmation Dialogs
```typescript
<AlertDialog open={bulkDeleteDialogOpen}>
  {/* Confirmation UI */}
</AlertDialog>
```

### ✅ Item Preview (Small Selections)
```typescript
{selectedItems.length <= 5 && (
  <ul>
    {selectedItems.map(item => <li>{item.name}</li>)}
  </ul>
)}
```

---

## Example Implementations

### Players Table
**Location**: `src/app/players/components/players-table-refactored.tsx`

**Implemented Actions**:
- ✅ Bulk Delete (with confirmation)

**Features**:
- Shows player names for ≤5 selections
- Permission-based (only if canDelete)
- Loading state during deletion
- Clears selection after success
- Refreshes data after deletion

### Ready for Other Tables

The same pattern can be applied to:
- Events table
- Coaches table
- Matches table
- Training sessions table
- Tests table
- Any other entity table

---

## API Quick Reference

### BulkActionsToolbar Props

```typescript
<BulkActionsToolbar
  selectedCount={number}              // Required
  onClearSelection={() => void}       // Required
  actions={BulkAction[]}             // Optional
  children={React.ReactNode}         // Optional
/>
```

### BulkAction Interface

```typescript
interface BulkAction {
  label: string
  icon?: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  onClick: () => void | Promise<void>
  disabled?: boolean
}
```

### Helper Functions

```typescript
// Get selected items
const selected = getSelectedItems(data, rowSelection)

// Get selected row IDs
const ids = getSelectedRowIds(rowSelection)
```

---

## Files Modified/Created

### Modified
1. `src/app/players/components/players-table-refactored.tsx` - Added bulk delete implementation
2. `docs/table-core-guide.md` - Added bulk actions references

### Created
1. `docs/BULK_ACTIONS_GUIDE.md` - Comprehensive guide
2. `docs/BULK_ACTIONS_QUICKSTART.md` - Quick start guide
3. `docs/BULK_ACTIONS_SUMMARY.md` - This summary

### Existing (Already Available)
1. `src/lib/table-core/components/BulkActionsToolbar.tsx` - Toolbar component
2. `src/lib/table-core/utils/column-helpers.tsx` - Selection column helper
3. `src/lib/table-core/utils/table-helpers.ts` - Helper functions

---

## Testing Checklist

To test bulk actions:

- [ ] Enable row selection in a table
- [ ] Select multiple rows using checkboxes
- [ ] Verify BulkActionsToolbar appears
- [ ] Verify action buttons are visible based on permissions
- [ ] Click bulk delete button
- [ ] Verify confirmation dialog appears
- [ ] Verify item list shows (for ≤5 selections)
- [ ] Confirm deletion
- [ ] Verify loading state shows
- [ ] Verify items are deleted
- [ ] Verify selection clears after success
- [ ] Verify table refreshes with updated data
- [ ] Test "Clear Selection" button
- [ ] Test with different selection counts (1, 5, 10, 50)

---

## Next Steps

### For Developers

1. **Read the Quick Start Guide** (`BULK_ACTIONS_QUICKSTART.md`) to add bulk actions to other tables
2. **Reference the Comprehensive Guide** (`BULK_ACTIONS_GUIDE.md`) for advanced patterns
3. **Check the Players Table** for a working example

### To Add to Other Tables

1. Follow the 8-step quick start guide
2. Customize actions based on entity type
3. Add permission checks
4. Implement confirmation dialogs for destructive actions
5. Test thoroughly

### Common Actions to Implement

- **Events**: Bulk delete, bulk cancel, bulk duplicate
- **Coaches**: Bulk assign to teams, bulk export
- **Matches**: Bulk reschedule, bulk update status
- **Training Sessions**: Bulk mark attendance, bulk cancel
- **Tests**: Bulk publish results, bulk archive

---

## Benefits

✅ **Efficiency**: Perform operations on multiple items at once
✅ **Consistency**: Standardized UI across all tables
✅ **Safety**: Built-in confirmation dialogs for destructive actions
✅ **Permissions**: Integrated with existing authorization system
✅ **UX**: Clear feedback with loading states and success messages
✅ **Flexibility**: Easy to add custom actions
✅ **Type-Safe**: Full TypeScript support

---

## Support

- **Documentation**: See `BULK_ACTIONS_GUIDE.md` and `BULK_ACTIONS_QUICKSTART.md`
- **Example**: Check `src/app/players/components/players-table-refactored.tsx`
- **Table Core**: See `docs/table-core-guide.md`

---

**Status**: ✅ Fully Implemented and Documented
**Last Updated**: 2025-12-30
