# Bulk Actions Guide

This guide explains how to implement and customize bulk actions for selected rows in table-core tables.

## Overview

Bulk actions allow users to perform operations on multiple selected rows at once. The table-core system provides a flexible `BulkActionsToolbar` component that displays when rows are selected.

## Table of Contents

1. [Enable Row Selection](#enable-row-selection)
2. [Configure Bulk Actions](#configure-bulk-actions)
3. [Built-in Features](#built-in-features)
4. [Common Patterns](#common-patterns)
5. [Example Implementation](#example-implementation)
6. [API Reference](#api-reference)

---

## Enable Row Selection

### Step 1: Enable in Table Config

First, enable row selection in your table configuration:

```typescript
// src/config/tables/your-entity.config.ts
export const yourEntityTableConfig: TableConfig<YourEntity> = {
  // ... other config
  features: {
    selection: true,  // Enable row selection
    // ... other features
  },
}
```

### Step 2: Add Selection Column

Add the selection column to your column definitions:

```typescript
// src/config/tables/columns/your-entity-columns.tsx
import { createSelectionColumn } from '@/lib/table-core'

export function createYourEntityColumns({
  enableSelection = false,
  // ... other options
}: CreateColumnsOptions): ColumnDef<YourEntity>[] {
  const baseColumns: ColumnDef<YourEntity>[] = []

  // Add selection column if enabled
  if (enableSelection) {
    baseColumns.push(createSelectionColumn<YourEntity>())
  }

  // ... add other columns

  return baseColumns
}
```

### Step 3: Add Row Selection State

In your table component, add row selection state:

```typescript
import { RowSelectionState } from '@tanstack/react-table'
import { getSelectedItems } from '@/lib/table-core'

export default function YourEntityTable({ entities, ... }) {
  // Row selection state
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  // Get selected items
  const selectedItems = React.useMemo(
    () => getSelectedItems(entities, rowSelection),
    [entities, rowSelection]
  )

  // Clear selection handler
  const handleClearSelection = React.useCallback(() => {
    setRowSelection({})
  }, [])

  // Pass to BaseDataTable
  <BaseDataTable
    enableRowSelection={yourEntityTableConfig.features.selection}
    rowSelection={rowSelection}
    onRowSelectionChange={setRowSelection}
    // ... other props
  />
}
```

---

## Configure Bulk Actions

### Basic Structure

Define bulk actions using the `BulkAction` interface:

```typescript
interface BulkAction {
  label: string                    // Button text
  icon?: React.ReactNode          // Optional icon
  variant?: ButtonVariant         // Button style
  onClick: () => void | Promise<void>  // Action handler
  disabled?: boolean              // Disable condition
}
```

### Simple Example

```typescript
const bulkActions = [
  {
    label: 'Delete Selected',
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'destructive',
    onClick: handleBulkDelete,
    disabled: !canDelete,
  },
  {
    label: 'Export Selected',
    icon: <Download className="h-4 w-4" />,
    variant: 'outline',
    onClick: handleBulkExport,
  },
]
```

### Advanced Example with Memoization

```typescript
const bulkActions = React.useMemo(() => {
  const actions = []

  // Conditional actions based on permissions
  if (canDelete) {
    actions.push({
      label: `Delete ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''}`,
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive' as const,
      onClick: handleBulkDelete,
      disabled: selectedItems.length === 0,
    })
  }

  if (canUpdate) {
    actions.push({
      label: 'Update Status',
      icon: <Edit className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: handleBulkUpdate,
    })
  }

  // Always available actions
  actions.push({
    label: 'Export Selected',
    icon: <Download className="h-4 w-4" />,
    variant: 'outline' as const,
    onClick: handleBulkExport,
  })

  return actions
}, [canDelete, canUpdate, selectedItems.length, handleBulkDelete, handleBulkUpdate, handleBulkExport])
```

---

## Built-in Features

### BulkActionsToolbar Component

The `BulkActionsToolbar` component provides:

- **Selected Count Display**: Shows how many rows are selected
- **Action Buttons**: Renders your configured actions
- **Clear Selection Button**: Always available to deselect all
- **Loading States**: Automatically handles async operations
- **Responsive Design**: Mobile-friendly layout

### Usage

```typescript
{selectedItems.length > 0 && (
  <BulkActionsToolbar
    selectedCount={selectedItems.length}
    onClearSelection={handleClearSelection}
    actions={bulkActions}
  />
)}
```

---

## Common Patterns

### 1. Bulk Delete with Confirmation

```typescript
// State
const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false)
const [isBulkDeleting, setIsBulkDeleting] = React.useState(false)

// Handler to open dialog
const handleBulkDelete = React.useCallback(() => {
  if (selectedItems.length === 0) return
  setBulkDeleteDialogOpen(true)
}, [selectedItems])

// Confirm deletion
const handleConfirmBulkDelete = React.useCallback(async () => {
  if (selectedItems.length === 0) return

  setIsBulkDeleting(true)
  try {
    await Promise.all(
      selectedItems.map(item => deleteEntity(item.id))
    )
    setBulkDeleteDialogOpen(false)
    handleClearSelection()
    onRefetch?.()
  } catch (error) {
    console.error('Failed to delete items:', error)
  } finally {
    setIsBulkDeleting(false)
  }
}, [selectedItems, deleteEntity, handleClearSelection, onRefetch])

// Dialog
<AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete {selectedItems.length} Items?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleConfirmBulkDelete}
        disabled={isBulkDeleting}
        className="bg-destructive"
      >
        {isBulkDeleting ? 'Deleting...' : 'Delete'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 2. Bulk Export

```typescript
const handleBulkExport = React.useCallback(() => {
  const timestamp = new Date().toISOString().split('T')[0]

  exportToCSV(
    selectedItems,
    [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'status', label: 'Status' },
    ],
    `selected-items-${timestamp}.csv`
  )
}, [selectedItems])
```

### 3. Bulk Update with Dialog

```typescript
const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = React.useState(false)
const [newStatus, setNewStatus] = React.useState('')

const handleBulkUpdate = React.useCallback(() => {
  setBulkUpdateDialogOpen(true)
}, [])

const handleConfirmBulkUpdate = React.useCallback(async () => {
  if (!newStatus) return

  try {
    await Promise.all(
      selectedItems.map(item =>
        updateEntity(item.id, { status: newStatus })
      )
    )
    setBulkUpdateDialogOpen(false)
    handleClearSelection()
    onRefetch?.()
  } catch (error) {
    console.error('Failed to update items:', error)
  }
}, [selectedItems, newStatus, updateEntity, handleClearSelection, onRefetch])

// Dialog with status selector
<Dialog open={bulkUpdateDialogOpen} onOpenChange={setBulkUpdateDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Update {selectedItems.length} Items</DialogTitle>
    </DialogHeader>
    <Select value={newStatus} onValueChange={setNewStatus}>
      <SelectTrigger>
        <SelectValue placeholder="Select new status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
      </SelectContent>
    </Select>
    <DialogFooter>
      <Button variant="outline" onClick={() => setBulkUpdateDialogOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirmBulkUpdate}>
        Update
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 4. Bulk Assign to Category/Group

```typescript
const handleBulkAssign = React.useCallback(async (categoryId: string) => {
  try {
    await Promise.all(
      selectedItems.map(item =>
        assignToCategory(item.id, categoryId)
      )
    )
    handleClearSelection()
    onRefetch?.()
  } catch (error) {
    console.error('Failed to assign items:', error)
  }
}, [selectedItems, assignToCategory, handleClearSelection, onRefetch])
```

### 5. Custom Bulk Actions with Dropdown

```typescript
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu'

// Add to BulkActionsToolbar children
<BulkActionsToolbar
  selectedCount={selectedItems.length}
  onClearSelection={handleClearSelection}
  actions={bulkActions}
>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">
        More Actions <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={handleBulkArchive}>
        <Archive className="mr-2 h-4 w-4" />
        Archive
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleBulkDuplicate}>
        <Copy className="mr-2 h-4 w-4" />
        Duplicate
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</BulkActionsToolbar>
```

---

## Example Implementation

Here's a complete example from the Players table:

```typescript
export default function PlayersTable({ players, ... }) {
  // Row selection state
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  // Bulk action states
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false)

  // Get selected players
  const selectedPlayers = React.useMemo(
    () => getSelectedItems(players, rowSelection),
    [players, rowSelection]
  )

  // Clear selection
  const handleClearSelection = React.useCallback(() => {
    setRowSelection({})
  }, [])

  // Bulk delete handler
  const handleBulkDelete = React.useCallback(() => {
    if (selectedPlayers.length === 0) return
    setBulkDeleteDialogOpen(true)
  }, [selectedPlayers])

  // Confirm bulk delete
  const handleConfirmBulkDelete = React.useCallback(async () => {
    if (selectedPlayers.length === 0) return

    setIsBulkDeleting(true)
    try {
      await Promise.all(
        selectedPlayers.map(player => deletePlayer(player.id))
      )
      setBulkDeleteDialogOpen(false)
      handleClearSelection()
      onRefetch?.()
    } catch (error) {
      console.error('Failed to delete players:', error)
    } finally {
      setIsBulkDeleting(false)
    }
  }, [selectedPlayers, deletePlayer, handleClearSelection, onRefetch])

  // Bulk actions configuration
  const bulkActions = React.useMemo(() => {
    const actions = []

    if (canDelete) {
      actions.push({
        label: `Delete ${selectedPlayers.length} player${selectedPlayers.length !== 1 ? 's' : ''}`,
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'destructive' as const,
        onClick: handleBulkDelete,
      })
    }

    return actions
  }, [canDelete, selectedPlayers.length, handleBulkDelete])

  return (
    <div>
      {/* Bulk Actions Toolbar */}
      {selectedPlayers.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedPlayers.length}
          onClearSelection={handleClearSelection}
          actions={bulkActions}
        />
      )}

      {/* Table */}
      <BaseDataTable
        data={players}
        columns={columns}
        enableRowSelection={true}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        {...otherProps}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Players</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedPlayers.length} player
              {selectedPlayers.length !== 1 ? 's' : ''}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive"
            >
              {isBulkDeleting ? 'Deleting...' : `Delete ${selectedPlayers.length}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

---

## API Reference

### BulkActionsToolbar Props

```typescript
interface BulkActionsToolbarProps {
  selectedCount: number           // Number of selected rows
  onClearSelection: () => void   // Handler to clear selection
  actions?: BulkAction[]         // Array of bulk actions
  children?: React.ReactNode     // Custom content (dropdowns, etc.)
}
```

### BulkAction Interface

```typescript
interface BulkAction {
  label: string                              // Button text
  icon?: React.ReactNode                    // Optional icon
  variant?: 'default' | 'destructive' |     // Button variant
            'outline' | 'secondary' |
            'ghost' | 'link'
  onClick: () => void | Promise<void>       // Action handler
  disabled?: boolean                        // Disable button
}
```

### Helper Functions

#### getSelectedItems

Get selected items from data based on row selection state.

```typescript
function getSelectedItems<TData extends { id: string }>(
  data: TData[],
  rowSelection: Record<string, boolean>
): TData[]
```

**Usage:**
```typescript
const selectedItems = getSelectedItems(entities, rowSelection)
```

#### getSelectedRowIds

Get array of selected row indices.

```typescript
function getSelectedRowIds(
  rowSelection: Record<string, boolean>
): string[]
```

---

## Best Practices

### 1. Always Use Confirmation Dialogs for Destructive Actions

```typescript
// ❌ Bad: No confirmation
const handleBulkDelete = async () => {
  await deleteItems(selectedItems)
}

// ✅ Good: With confirmation
const handleBulkDelete = () => {
  setBulkDeleteDialogOpen(true)
}
```

### 2. Show Item Details in Confirmation (for small selections)

```typescript
{selectedItems.length <= 5 && (
  <div className="mt-3">
    <p className="text-sm font-medium">Items to be deleted:</p>
    <ul className="list-disc list-inside">
      {selectedItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  </div>
)}
```

### 3. Clear Selection After Successful Operations

```typescript
const handleBulkOperation = async () => {
  try {
    await performOperation(selectedItems)
    handleClearSelection()  // ✅ Clear after success
    onRefetch()
  } catch (error) {
    // Don't clear on error - user may want to retry
  }
}
```

### 4. Use Memoization for Actions

```typescript
// ✅ Memoized - only recalculates when dependencies change
const bulkActions = React.useMemo(() => {
  return [/* actions */]
}, [selectedItems.length, canDelete])
```

### 5. Provide Loading Feedback

```typescript
// ✅ Show loading state
<AlertDialogAction disabled={isProcessing}>
  {isProcessing ? 'Processing...' : 'Confirm'}
</AlertDialogAction>
```

### 6. Handle Errors Gracefully

```typescript
try {
  await bulkOperation()
} catch (error) {
  console.error('Bulk operation failed:', error)
  toast.error('Failed to complete operation. Please try again.')
}
```

---

## Troubleshooting

### Selection Not Working

**Problem**: Rows don't select when clicking checkboxes.

**Solution**: Ensure you've:
1. Enabled selection in table config
2. Added selection column to column definitions
3. Passed `rowSelection` and `onRowSelectionChange` to `BaseDataTable`
4. Set `enableRowSelection={true}` on `BaseDataTable`

### Selected Items Incorrect After Page Change

**Problem**: Selected items don't match after pagination.

**Solution**: The `getSelectedItems` helper works with the current page data. This is intentional - selections are page-specific. If you need cross-page selection, you'll need to maintain a separate state with item IDs.

### Bulk Actions Not Showing

**Problem**: BulkActionsToolbar doesn't appear.

**Solution**: Check conditional rendering:
```typescript
{selectedItems.length > 0 && (
  <BulkActionsToolbar ... />
)}
```

---

## Summary

The table-core bulk actions system provides:

✅ **Flexible Configuration** - Define custom actions with icons and variants
✅ **Permission-Based** - Show/hide actions based on user permissions
✅ **Loading States** - Built-in handling for async operations
✅ **Confirmation Dialogs** - Easy integration with AlertDialog
✅ **Responsive Design** - Mobile-friendly out of the box
✅ **Type-Safe** - Full TypeScript support

For more examples, see the Players table implementation at:
- `src/app/players/components/players-table-refactored.tsx`
